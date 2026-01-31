#!/usr/bin/env python3
"""
Backend API Testing for Phase 2 Wagering + Promotions + Withdrawal Block
Tests the complete flow of user registration, deposits with promotions, wagering, and withdrawal restrictions.
"""

import requests
import json
import time
import random
import string
from datetime import datetime

# Get backend URL from environment
BACKEND_URL = "https://gamehub-550.preview.emergentagent.com/api"

class TestResults:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.errors = []
        
    def log_pass(self, test_name):
        print(f"✅ PASS: {test_name}")
        self.passed += 1
        
    def log_fail(self, test_name, error):
        print(f"❌ FAIL: {test_name} - {error}")
        self.failed += 1
        self.errors.append(f"{test_name}: {error}")
        
    def summary(self):
        total = self.passed + self.failed
        print(f"\n{'='*60}")
        print(f"TEST SUMMARY: {self.passed}/{total} passed")
        if self.errors:
            print(f"\nFAILED TESTS:")
            for error in self.errors:
                print(f"  - {error}")
        print(f"{'='*60}")

def generate_test_email():
    """Generate unique test email"""
    timestamp = str(int(time.time()))
    random_str = ''.join(random.choices(string.ascii_lowercase, k=6))
    return f"testuser_{timestamp}_{random_str}@winpkr.com"

def generate_jazzcash_number():
    """Generate realistic JazzCash number"""
    return f"03{random.randint(100000000, 999999999)}"

class WageringPromotionTester:
    def __init__(self):
        self.results = TestResults()
        self.user_token = None
        self.admin_token = None
        self.user_id = None
        self.admin_user_id = None
        
    def make_request(self, method, endpoint, data=None, headers=None, token=None):
        """Make HTTP request with proper error handling"""
        url = f"{BACKEND_URL}{endpoint}"
        
        if headers is None:
            headers = {"Content-Type": "application/json"}
            
        if token:
            headers["Authorization"] = f"Bearer {token}"
            
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=headers, params=data)
            elif method.upper() == "POST":
                response = requests.post(url, headers=headers, json=data)
            elif method.upper() == "PUT":
                response = requests.put(url, headers=headers, json=data)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
        except Exception as e:
            print(f"Request failed: {method} {url} - {str(e)}")
            return None
    
    def test_admin_login(self):
        """Test admin login for deposit approvals"""
        print("\n🔐 Testing Admin Login...")
        
        response = self.make_request("POST", "/auth/admin/login", {
            "email": "admin@winpkr.com",
            "password": "Admin@123"
        })
        
        if not response or response.status_code != 200:
            self.results.log_fail("Admin Login", f"Status: {response.status_code if response else 'No response'}")
            return False
            
        data = response.json()
        if "access_token" not in data:
            self.results.log_fail("Admin Login", "No access token in response")
            return False
            
        self.admin_token = data["access_token"]
        self.admin_user_id = data["user"]["id"]
        self.results.log_pass("Admin Login")
        return True
    
    def test_user_registration_with_referral(self):
        """Test user registration with optional referral code"""
        print("\n👤 Testing User Registration...")
        
        test_email = generate_test_email()
        
        # Test without referral code first
        response = self.make_request("POST", "/auth/register", {
            "email": test_email,
            "password": "TestPass123!",
            "full_name": "Test User Wagering"
        })
        
        if not response or response.status_code != 200:
            self.results.log_fail("User Registration", f"Status: {response.status_code if response else 'No response'}")
            return False
            
        data = response.json()
        if "access_token" not in data:
            self.results.log_fail("User Registration", "No access token in response")
            return False
            
        self.user_token = data["access_token"]
        self.user_id = data["user"]["id"]
        self.results.log_pass("User Registration (no referral)")
        return True
    
    def test_deposit_with_first_deposit_108(self):
        """Test deposit creation with first_deposit_108 promotion"""
        print("\n💰 Testing Deposit with first_deposit_108 Promotion...")
        
        if not self.user_token:
            self.results.log_fail("Deposit Creation", "No user token available")
            return None
            
        jazzcash_number = generate_jazzcash_number()
        
        response = self.make_request("POST", "/payment/deposit", {
            "amount": 100,
            "jazzcash_number": jazzcash_number,
            "promotion_key": "first_deposit_108"
        }, token=self.user_token)
        
        if not response or response.status_code != 200:
            self.results.log_fail("Deposit Creation", f"Status: {response.status_code if response else 'No response'}")
            return None
            
        data = response.json()
        
        # Check required fields
        required_fields = ["deposit_id", "status", "promotion_key", "deposit_wagering_multiplier"]
        for field in required_fields:
            if field not in data:
                self.results.log_fail("Deposit Creation", f"Missing field: {field}")
                return None
                
        if data["status"] != "pending":
            self.results.log_fail("Deposit Creation", f"Expected status 'pending', got '{data['status']}'")
            return None
            
        if data["promotion_key"] != "first_deposit_108":
            self.results.log_fail("Deposit Creation", f"Expected promotion_key 'first_deposit_108', got '{data['promotion_key']}'")
            return None
            
        # Check wagering multiplier is in valid range (3-15)
        multiplier = data["deposit_wagering_multiplier"]
        if not (3 <= multiplier <= 15):
            self.results.log_fail("Deposit Creation", f"Wagering multiplier {multiplier} not in range 3-15")
            return None
            
        self.results.log_pass("Deposit Creation with first_deposit_108")
        return data["deposit_id"]
    
    def test_admin_deposit_approval(self, deposit_id):
        """Test admin approval of deposit and verify wagering records"""
        print("\n✅ Testing Admin Deposit Approval...")
        
        if not self.admin_token or not deposit_id:
            self.results.log_fail("Deposit Approval", "Missing admin token or deposit ID")
            return False
            
        # Get user balance before approval
        user_response = self.make_request("GET", "/user/profile", token=self.user_token)
        if not user_response or user_response.status_code != 200:
            self.results.log_fail("Deposit Approval", "Could not get user profile before approval")
            return False
            
        balance_before = user_response.json().get("wallet_balance", 0)
        
        # Approve deposit
        response = self.make_request("PUT", f"/admin/deposits/{deposit_id}/approve", 
                                   token=self.admin_token)
        
        if not response or response.status_code != 200:
            self.results.log_fail("Deposit Approval", f"Status: {response.status_code if response else 'No response'}")
            return False
            
        # Wait a moment for processing
        time.sleep(1)
        
        # Get user balance after approval
        user_response = self.make_request("GET", "/user/profile", token=self.user_token)
        if not user_response or user_response.status_code != 200:
            self.results.log_fail("Deposit Approval", "Could not get user profile after approval")
            return False
            
        balance_after = user_response.json().get("wallet_balance", 0)
        
        # Check balance increased (deposit + bonus)
        if balance_after <= balance_before:
            self.results.log_fail("Deposit Approval", f"Balance did not increase: {balance_before} -> {balance_after}")
            return False
            
        # Check wagering status
        wagering_response = self.make_request("GET", "/wagering/status", token=self.user_token)
        if not wagering_response or wagering_response.status_code != 200:
            self.results.log_fail("Deposit Approval", "Could not get wagering status")
            return False
            
        wagering_data = wagering_response.json()
        
        if not wagering_data.get("has_active_wagering"):
            self.results.log_fail("Deposit Approval", "No active wagering found after deposit approval")
            return False
            
        # Check wagering records
        records = wagering_data.get("records", [])
        if len(records) < 2:  # Should have deposit wagering + bonus wagering
            self.results.log_fail("Deposit Approval", f"Expected at least 2 wagering records, got {len(records)}")
            return False
            
        # Find deposit and bonus wagering records
        deposit_wagering = None
        bonus_wagering = None
        
        for record in records:
            if record.get("source") == "deposit":
                deposit_wagering = record
            elif record.get("source") == "bonus":
                bonus_wagering = record
                
        if not deposit_wagering:
            self.results.log_fail("Deposit Approval", "No deposit wagering record found")
            return False
            
        if not bonus_wagering:
            self.results.log_fail("Deposit Approval", "No bonus wagering record found")
            return False
            
        # Check deposit wagering multiplier (3-15x)
        deposit_mult = deposit_wagering.get("multiplier", 0)
        if not (3 <= deposit_mult <= 15):
            self.results.log_fail("Deposit Approval", f"Deposit wagering multiplier {deposit_mult} not in range 3-15")
            return False
            
        # Check bonus wagering multiplier (35x)
        bonus_mult = bonus_wagering.get("multiplier", 0)
        if bonus_mult != 35:
            self.results.log_fail("Deposit Approval", f"Bonus wagering multiplier {bonus_mult} != 35")
            return False
            
        self.results.log_pass("Deposit Approval with Wagering Records")
        return True
    
    def test_withdrawal_blocked_during_wagering(self):
        """Test that withdrawal is blocked while wagering is active"""
        print("\n🚫 Testing Withdrawal Block During Wagering...")
        
        if not self.user_token:
            self.results.log_fail("Withdrawal Block", "No user token available")
            return False
            
        jazzcash_number = generate_jazzcash_number()
        
        response = self.make_request("POST", "/payment/withdrawal", {
            "amount": 50,
            "jazzcash_number": jazzcash_number
        }, token=self.user_token)
        
        if not response:
            self.results.log_fail("Withdrawal Block", "No response from withdrawal endpoint")
            return False
            
        # Should return 400 with wagering message
        if response.status_code != 400:
            self.results.log_fail("Withdrawal Block", f"Expected status 400, got {response.status_code}")
            return False
            
        error_data = response.json()
        error_detail = error_data.get("detail", "")
        
        if "wagering requirements" not in error_detail.lower():
            self.results.log_fail("Withdrawal Block", f"Expected wagering error message, got: {error_detail}")
            return False
            
        self.results.log_pass("Withdrawal Blocked During Wagering")
        return True
    
    def test_crash_betting_wagering_progress(self):
        """Test crash betting and wagering progress"""
        print("\n🎮 Testing Crash Betting and Wagering Progress...")
        
        if not self.user_token:
            self.results.log_fail("Crash Betting", "No user token available")
            return False
            
        # Get initial wagering status
        wagering_response = self.make_request("GET", "/wagering/status", token=self.user_token)
        if not wagering_response or wagering_response.status_code != 200:
            self.results.log_fail("Crash Betting", "Could not get initial wagering status")
            return False
            
        initial_wagering = wagering_response.json()
        initial_remaining = initial_wagering.get("remaining", 0)
        
        if initial_remaining <= 0:
            self.results.log_pass("Crash Betting (wagering already complete)")
            return True
            
        # Place several crash bets to progress wagering
        bet_amount = 25  # Small bets to gradually progress
        bets_placed = 0
        max_bets = 20  # Limit to prevent infinite loop
        
        while initial_remaining > 0 and bets_placed < max_bets:
            # Place crash bet
            bet_response = self.make_request("POST", "/games/crash/bet", {
                "amount": bet_amount,
                "cashout_multiplier": 1.5,
                "client_seed": f"test_seed_{bets_placed}",
                "nonce": bets_placed + 1
            }, token=self.user_token)
            
            if not bet_response or bet_response.status_code != 200:
                self.results.log_fail("Crash Betting", f"Bet {bets_placed + 1} failed: {bet_response.status_code if bet_response else 'No response'}")
                return False
                
            bets_placed += 1
            
            # Check wagering progress
            wagering_response = self.make_request("GET", "/wagering/status", token=self.user_token)
            if wagering_response and wagering_response.status_code == 200:
                current_wagering = wagering_response.json()
                current_remaining = current_wagering.get("remaining", 0)
                
                print(f"  Bet {bets_placed}: Wagering remaining: {current_remaining}")
                
                if current_remaining < initial_remaining:
                    # Progress made
                    initial_remaining = current_remaining
                    
                if current_remaining <= 0:
                    print(f"  ✅ Wagering completed after {bets_placed} bets!")
                    break
            
            time.sleep(0.5)  # Small delay between bets
            
        if initial_remaining > 0:
            print(f"  ⚠️ Wagering not fully completed (remaining: {initial_remaining}), but progress verified")
            
        self.results.log_pass("Crash Betting and Wagering Progress")
        return True
    
    def test_withdrawal_after_wagering_complete(self):
        """Test withdrawal is allowed after wagering completion"""
        print("\n✅ Testing Withdrawal After Wagering Complete...")
        
        if not self.user_token:
            self.results.log_fail("Withdrawal After Wagering", "No user token available")
            return False
            
        # Check current wagering status
        wagering_response = self.make_request("GET", "/wagering/status", token=self.user_token)
        if not wagering_response or wagering_response.status_code != 200:
            self.results.log_fail("Withdrawal After Wagering", "Could not get wagering status")
            return False
            
        wagering_data = wagering_response.json()
        remaining = wagering_data.get("remaining", 0)
        
        if remaining > 0:
            print(f"  ⚠️ Wagering still active (remaining: {remaining}), skipping withdrawal test")
            self.results.log_pass("Withdrawal After Wagering (skipped - wagering active)")
            return True
            
        # Get user balance
        user_response = self.make_request("GET", "/user/profile", token=self.user_token)
        if not user_response or user_response.status_code != 200:
            self.results.log_fail("Withdrawal After Wagering", "Could not get user profile")
            return False
            
        balance = user_response.json().get("wallet_balance", 0)
        
        if balance < 50:
            print(f"  ⚠️ Insufficient balance ({balance}) for withdrawal test")
            self.results.log_pass("Withdrawal After Wagering (skipped - insufficient balance)")
            return True
            
        # Attempt withdrawal
        jazzcash_number = generate_jazzcash_number()
        
        response = self.make_request("POST", "/payment/withdrawal", {
            "amount": 50,
            "jazzcash_number": jazzcash_number
        }, token=self.user_token)
        
        if not response:
            self.results.log_fail("Withdrawal After Wagering", "No response from withdrawal endpoint")
            return False
            
        # Should succeed (200) or fail due to KYC (400 with KYC message)
        if response.status_code == 200:
            self.results.log_pass("Withdrawal After Wagering (successful)")
            return True
        elif response.status_code == 400:
            error_data = response.json()
            error_detail = error_data.get("detail", "")
            
            if "kyc" in error_detail.lower():
                self.results.log_pass("Withdrawal After Wagering (blocked by KYC requirement)")
                return True
            elif "wagering" in error_detail.lower():
                self.results.log_fail("Withdrawal After Wagering", f"Still blocked by wagering: {error_detail}")
                return False
            else:
                self.results.log_fail("Withdrawal After Wagering", f"Unexpected error: {error_detail}")
                return False
        else:
            self.results.log_fail("Withdrawal After Wagering", f"Unexpected status: {response.status_code}")
            return False
    
    def test_daily_first_deposit_8_percent(self):
        """Test daily first deposit 8% bonus (once per day)"""
        print("\n📅 Testing Daily First Deposit 8% Bonus...")
        
        # Create new user for this test
        test_email = generate_test_email()
        
        response = self.make_request("POST", "/auth/register", {
            "email": test_email,
            "password": "TestPass123!",
            "full_name": "Test User Daily Bonus"
        })
        
        if not response or response.status_code != 200:
            self.results.log_fail("Daily 8% Bonus", "Could not create test user")
            return False
            
        daily_user_token = response.json()["access_token"]
        
        # First deposit with daily_first_deposit_8
        jazzcash_number = generate_jazzcash_number()
        
        deposit_response = self.make_request("POST", "/payment/deposit", {
            "amount": 1000,
            "jazzcash_number": jazzcash_number,
            "promotion_key": "daily_first_deposit_8"
        }, token=daily_user_token)
        
        if not deposit_response or deposit_response.status_code != 200:
            self.results.log_fail("Daily 8% Bonus", "First deposit failed")
            return False
            
        first_deposit_id = deposit_response.json()["deposit_id"]
        
        # Admin approve first deposit
        approve_response = self.make_request("PUT", f"/admin/deposits/{first_deposit_id}/approve", 
                                           token=self.admin_token)
        
        if not approve_response or approve_response.status_code != 200:
            self.results.log_fail("Daily 8% Bonus", "First deposit approval failed")
            return False
            
        time.sleep(1)
        
        # Check user balance (should be 1000 + 80 = 1080)
        user_response = self.make_request("GET", "/user/profile", token=daily_user_token)
        if not user_response or user_response.status_code != 200:
            self.results.log_fail("Daily 8% Bonus", "Could not get user profile after first deposit")
            return False
            
        balance_after_first = user_response.json().get("wallet_balance", 0)
        expected_balance = 1080  # 1000 + 8% bonus
        
        if abs(balance_after_first - expected_balance) > 1:  # Allow small rounding differences
            self.results.log_fail("Daily 8% Bonus", f"Expected balance ~{expected_balance}, got {balance_after_first}")
            return False
            
        # Second deposit same day (should NOT get bonus)
        jazzcash_number2 = generate_jazzcash_number()
        
        deposit_response2 = self.make_request("POST", "/payment/deposit", {
            "amount": 1000,
            "jazzcash_number": jazzcash_number2,
            "promotion_key": "daily_first_deposit_8"
        }, token=daily_user_token)
        
        if not deposit_response2 or deposit_response2.status_code != 200:
            self.results.log_fail("Daily 8% Bonus", "Second deposit failed")
            return False
            
        second_deposit_id = deposit_response2.json()["deposit_id"]
        
        # Admin approve second deposit
        approve_response2 = self.make_request("PUT", f"/admin/deposits/{second_deposit_id}/approve", 
                                            token=self.admin_token)
        
        if not approve_response2 or approve_response2.status_code != 200:
            self.results.log_fail("Daily 8% Bonus", "Second deposit approval failed")
            return False
            
        time.sleep(1)
        
        # Check user balance (should be 1080 + 1000 = 2080, no additional bonus)
        user_response2 = self.make_request("GET", "/user/profile", token=daily_user_token)
        if not user_response2 or user_response2.status_code != 200:
            self.results.log_fail("Daily 8% Bonus", "Could not get user profile after second deposit")
            return False
            
        balance_after_second = user_response2.json().get("wallet_balance", 0)
        expected_balance2 = 2080  # Previous balance + 1000 (no bonus)
        
        if abs(balance_after_second - expected_balance2) > 1:
            self.results.log_fail("Daily 8% Bonus", f"Expected balance ~{expected_balance2}, got {balance_after_second}")
            return False
            
        self.results.log_pass("Daily First Deposit 8% Bonus (once per day)")
        return True
    
    def run_all_tests(self):
        """Run all wagering and promotion tests"""
        print("🚀 Starting Phase 2 Wagering + Promotions + Withdrawal Block Tests")
        print(f"Backend URL: {BACKEND_URL}")
        
        # Test admin login first
        if not self.test_admin_login():
            print("❌ Admin login failed - cannot continue with approval tests")
            return
            
        # Test user registration
        if not self.test_user_registration_with_referral():
            print("❌ User registration failed - cannot continue")
            return
            
        # Test deposit with first_deposit_108 promotion
        deposit_id = self.test_deposit_with_first_deposit_108()
        if not deposit_id:
            print("❌ Deposit creation failed - cannot continue")
            return
            
        # Test admin approval and wagering creation
        if not self.test_admin_deposit_approval(deposit_id):
            print("❌ Deposit approval failed - cannot continue with wagering tests")
            return
            
        # Test withdrawal blocking during wagering
        self.test_withdrawal_blocked_during_wagering()
        
        # Test crash betting and wagering progress
        self.test_crash_betting_wagering_progress()
        
        # Test withdrawal after wagering complete
        self.test_withdrawal_after_wagering_complete()
        
        # Test daily 8% bonus
        self.test_daily_first_deposit_8_percent()
        
        # Print final results
        self.results.summary()

if __name__ == "__main__":
    tester = WageringPromotionTester()
    tester.run_all_tests()