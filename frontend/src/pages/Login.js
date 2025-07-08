import { Link, useNavigate } from 'react-router-dom';

const Login = () => {
  // ... existing code ...
  return (
    <div className="login-container">
      {/* ... existing code ... */}
      <form className="login-form" onSubmit={handleSubmit}>
        {/* ... existing code ... */}
        <button type="submit" className="login-btn" disabled={isSubmitting}>
          {isSubmitting ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <div className="signup-option">
        <span>Don't have an account?</span>
        <Link to="/signup" className="signup-link">Sign Up</Link>
      </div>
    </div>
  );
}; 