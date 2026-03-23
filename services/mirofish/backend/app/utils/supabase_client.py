import os
import jwt
from typing import Dict, Any, Optional
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL") or os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

# Initialize global admin client (Service Role)
# Use this only for background tasks that require full bypass of RLS
_admin_client: Optional[Client] = None

def get_admin_client() -> Client:
    """Returns a Supabase client configured with the Service Role Key (Bypasses RLS)."""
    global _admin_client
    if not _admin_client:
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise ValueError("Missing Supabase credentials in environment variables.")
        _admin_client = create_client(SUPABASE_URL, SUPABASE_KEY)
    return _admin_client

def verify_jwt(token: str) -> Dict[str, Any]:
    """
    Locally verifies a Supabase JWT without making a network request.
    This is extremely fast and ensures high concurrency for 300+ agents.
    """
    if not SUPABASE_JWT_SECRET:
        raise ValueError("Missing SUPABASE_JWT_SECRET in environment variables.")
    
    try:
        # Supabase uses HS256 for signing its JWTs
        decoded = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated"
        )
        return decoded
    except jwt.ExpiredSignatureError:
        raise ValueError("Token has expired.")
    except jwt.InvalidTokenError as e:
        raise ValueError(f"Invalid token: {str(e)}")

def get_user_client(token: str) -> Client:
    """
    Returns a Supabase client that acts on behalf of a specific user.
    This ensures all database writes follow Row-Level Security (RLS) policies.
    """
    # 1. Verify the token locally for speed & security
    payload = verify_jwt(token)
    user_id = payload.get("sub")
    
    if not user_id:
        raise ValueError("Invalid decoded token: missing subject (sub).")

    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError("Missing Supabase configuration.")
        
    # 2. Create the client
    # In python sdk v2.5.0, we can pass headers. 
    # To act as the user, we initialize with the anon key and set the Authorization header.
    # We must use the anon key here, NOT the service role key, to respect RLS!
    anon_key = os.getenv("VITE_SUPABASE_ANON_KEY")
    client = create_client(SUPABASE_URL, anon_key, options={'headers': {'Authorization': f'Bearer {token}'}})
    
    return client

