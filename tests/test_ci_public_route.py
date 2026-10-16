"""Exercise the immutable public leaf guard and its disposable build route."""
import ast
import json
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
RECIPE = ROOT / '.github/workflows/ci-build-recipe.yml'
REPOSITORY_ID = 1341515318


class PublicBuildRouteTest(unittest.TestCase):
    def source(self):
        return RECIPE.read_text()

    def test_exact_leaf_guard_matches_owned_source_fixtures(self):
        source = self.source()
        match = re.search(r'(?m)^    if: >-\n((?:      .*\n)+)', source)
        self.assertIsNotNone(match, 'public admission must be guarded inside the immutable leaf job')
        guard = ' '.join(line.strip() for line in match[1].splitlines())
        self.assertIn("github.repository_id == '" + str(REPOSITORY_ID) + "'", guard)
        self.assertIn('github.event.pull_request.head.repo.id == ' + str(REPOSITORY_ID), guard)
        for fixture in json.loads((ROOT / 'tests/ci_public_guard_cases.json').read_text()):
            with self.subTest(case=fixture['name']):
                expression = guard
                for key, value in sorted(fixture['github'].items(), key=lambda item: -len(item[0])):
                    expression = expression.replace(key, repr(value))
                expression = expression.replace('&&', ' and ').replace('||', ' or ')
                expression = re.sub(r'\btrue\b', 'True', expression)
                expression = re.sub(r'\bfalse\b', 'False', expression)
                tree = ast.parse(expression.strip(), mode='eval')
                allowed = (ast.Expression, ast.BoolOp, ast.And, ast.Or, ast.Compare,
                           ast.Eq, ast.Constant, ast.Load)
                self.assertTrue(all(isinstance(node, allowed) for node in ast.walk(tree)))
                self.assertEqual(eval(compile(tree, '<actual-job-guard>', 'eval'), {'__builtins__': {}}), fixture['allowed'])

    def test_public_build_route_is_static_read_only_and_bounded(self):
        source = self.source()
        self.assertIn('group: ci-build-public-ephemeral', source)
        self.assertIn('labels: [ci-linux-cpu-v1-r' + str(REPOSITORY_ID) + ']', source)
        self.assertIn('ref: ${{ github.sha }}', source)
        self.assertIn('persist-credentials: false', source)
        timeout = re.search(r'(?m)^    timeout-minutes: ([0-9]+)$', source)
        self.assertIsNotNone(timeout)
        self.assertGreater(int(timeout[1]), 0)
        self.assertLessEqual(int(timeout[1]), 120)
        for forbidden in ('secrets:', 'secrets.', ': write', 'inputs.', 'pull_request_target',
                          'repository_dispatch', '--privileged', '--network host', '--volume', '--mount', '--device'):
            self.assertNotIn(forbidden, source)
        for action in re.findall(r'uses: ([^\s#]+)', source):
            self.assertRegex(action, r'@[a-f0-9]{40}$')
        self.assertIn("python -m unittest discover -s tests -p 'test_ci_public_route.py'", source)

    def test_original_functional_checks_remain_in_the_leaf(self):
        source = self.source()
        for command in ['node scripts/scaffold.mjs', 'npm test --prefix "$RUNNER_TEMP/sample-deck"']:
            self.assertIn(command, source)


if __name__ == '__main__':
    unittest.main()
