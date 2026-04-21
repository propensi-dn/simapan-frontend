const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export async function requestPasswordReset(email: string): Promise<ForgotPasswordResponse> {
  const res = await fetch(`${API_BASE}/api/auth/password/forgot/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Gagal mengirim link reset password.');
  }
  return data;
}

export async function confirmPasswordReset(payload: {
  token: string;
  new_password: string;
  confirm_password: string;
}): Promise<ResetPasswordResponse> {
  const res = await fetch(`${API_BASE}/api/auth/password/reset/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    const errorMsg = Array.isArray(data.error)
      ? data.error.join(' ')
      : data.error || 'Gagal reset password.';
    throw new Error(errorMsg);
  }
  return data;
}