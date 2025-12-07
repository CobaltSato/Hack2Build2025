import hashlib

# List of custom errors from the contracts
errors = [
    "AgentNotFound()",
    "SameAgent()",
    "UnauthorizedFeedback()",
    "FeedbackAlreadyAuthorized()",
    "FeedbackNotAuthorized()",
    "InvalidScore()",
    "FeedbackAlreadySubmitted()",
    "FeedbackNotFound()",
    "UnauthorizedSender()"
]

target_signature = "0x7b221799"

print("Custom Error Signatures:")
print("=" * 50)

for error in errors:
    # Calculate keccak256 hash of the error signature
    # Note: Python's hashlib.sha3_256 is not the same as keccak256
    # We need to use a different approach or library
    print(f"{error:<30}")

print(f"\nLooking for signature: {target_signature}")
print("\nNote: Need proper keccak256 implementation for accurate signatures")
