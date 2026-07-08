import { gql } from '@apollo/client';

// ─── AUTH MUTATIONS ────────────────────────────────────────────────────────────
export const REGISTER_USER = gql`
  mutation RegisterUser($input: RegisterInput!) {
    register(input: $input) {
      success
      message
      user {
        id
        email
        firstName
        lastName
        role
      }
      accessToken
      refreshToken
    }
  }
`;

export const LOGIN_USER = gql`
  mutation LoginUser($input: LoginInput!) {
    login(input: $input) {
      success
      message
      user {
        id
        email
        firstName
        lastName
        role
        tenantId
        avatar
      }
      accessToken
      refreshToken
    }
  }
`;

export const REFRESH_TOKEN = gql`
  mutation RefreshToken($refreshToken: String!) {
    refreshToken(refreshToken: $refreshToken) {
      accessToken
      refreshToken
    }
  }
`;

export const LOGOUT_USER = gql`
  mutation LogoutUser {
    logout {
      success
    }
  }
`;

// ─── PASSWORD RESET ────────────────────────────────────────────────────────────
export const REQUEST_PASSWORD_RESET = gql`
  mutation RequestPasswordReset($email: String!) {
    requestPasswordReset(email: $email) {
      success
      message
    }
  }
`;

export const VERIFY_OTP = gql`
  mutation VerifyOtp($email: String!, $otp: String!) {
    verifyOtp(email: $email, otp: $otp) {
      success
      message
      resetToken
    }
  }
`;

export const RESET_PASSWORD = gql`
  mutation ResetPassword($resetToken: String!, $newPassword: String!) {
    resetPassword(resetToken: $resetToken, newPassword: $newPassword) {
      success
      message
    }
  }
`;

// ─── JOB APPLICATION ──────────────────────────────────────────────────────────
export const APPLY_FOR_JOB = gql`
  mutation ApplyForJob($input: JobApplicationInput!) {
    applyForJob(input: $input) {
      success
      message
      application {
        id
        status
        appliedAt
      }
    }
  }
`;

// ─── NEWSLETTER ────────────────────────────────────────────────────────────────
export const SUBSCRIBE_NEWSLETTER = gql`
  mutation SubscribeNewsletter($email: String!) {
    subscribeNewsletter(email: $email) {
      success
      message
    }
  }
`;
