import unittest

from models import LoanApplication
from main import get_user_application_number


class FakeResult:
    def __init__(self, rows):
        self._rows = rows

    def all(self):
        return self._rows


class FakeSession:
    def __init__(self, rows):
        self._rows = rows

    def exec(self, _stmt):
        return FakeResult(self._rows)


class ApplicationNumberTests(unittest.TestCase):
    def test_get_user_application_number_uses_user_only_sequence(self):
        user_rows = [
            LoanApplication(
                id=11,
                user_id=2,
                collateral_type="property",
                requested_amount=1000,
                tenure_years=5,
                credit_score=700,
            ),
            LoanApplication(
                id=18,
                user_id=2,
                collateral_type="gold",
                requested_amount=2000,
                tenure_years=3,
                credit_score=750,
            ),
            LoanApplication(
                id=24,
                user_id=2,
                collateral_type="property",
                requested_amount=3000,
                tenure_years=2,
                credit_score=800,
            ),
            LoanApplication(
                id=9,
                user_id=1,
                collateral_type="property",
                requested_amount=5000,
                tenure_years=7,
                credit_score=720,
            ),
        ]

        session = FakeSession(user_rows)

        self.assertEqual(get_user_application_number(session, 2, 11), 1)
        self.assertEqual(get_user_application_number(session, 2, 18), 2)
        self.assertEqual(get_user_application_number(session, 2, 24), 3)


if __name__ == "__main__":
    unittest.main()
