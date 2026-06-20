require 'rails_helper'

RSpec.describe "Api::V1::Auth", type: :request do
  let(:valid_attributes) { { email: 'user@example.com', password: 'password123', name: 'Test User' } }

  describe "POST /api/v1/auth/register" do
    it "creates a new user and returns success" do
      post "/api/v1/auth/register", params: valid_attributes
      expect(response).to have_http_status(:created)
      expect(JSON.parse(response.body)["message"]).to include("Registration successful")
    end

    it "returns error with invalid parameters" do
      post "/api/v1/auth/register", params: { email: '' }
      expect(response).to have_http_status(:unprocessable_entity)
      expect(JSON.parse(response.body)).to have_key("errors")
    end
  end

  describe "POST /api/v1/auth/login" do
    let!(:user) { User.create!(valid_attributes) }

    before do
      user.confirm! unless user.confirmed?
    end

    it "authenticates user and sets refresh token cookie" do
      post "/api/v1/auth/login", params: { email: user.email, password: 'password123' }
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json).to have_key("access_token")
      expect(json["user"]["email"]).to eq(user.email)
      expect(response.cookies).to have_key("refresh_token")
    end

    it "fails with wrong password" do
      post "/api/v1/auth/login", params: { email: user.email, password: 'wrongpassword' }
      expect(response).to have_http_status(:unauthorized)
      expect(JSON.parse(response.body)["error"]).to eq("Invalid email or password")
    end
  end

  describe "POST /api/v1/auth/refresh" do
    let!(:user) { User.create!(valid_attributes) }
    let!(:refresh_token) { user.generate_refresh_token! }

    before do
      user.confirm!
    end

    it "generates new access token with valid refresh cookie" do
      # Set cookie manually for testing request
      cookies[:refresh_token] = refresh_token

      post "/api/v1/auth/refresh"
      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)).to have_key("access_token")
    end

    it "returns unauthorized with invalid or missing refresh token" do
      post "/api/v1/auth/refresh"
      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "GET /api/v1/auth/me" do
    let!(:user) { User.create!(valid_attributes) }
    let(:token) { JwtService.encode({ user_id: user.id }) }

    before do
      user.confirm!
    end

    it "returns user details with valid JWT in header" do
      get "/api/v1/auth/me", headers: { "Authorization" => "Bearer #{token}" }
      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)["user"]["email"]).to eq(user.email)
    end

    it "returns unauthorized without valid token" do
      get "/api/v1/auth/me"
      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "POST /api/v1/auth/forgot-password" do
    let!(:user) { User.create!(valid_attributes) }

    it "sends a reset password email if the user exists" do
      expect {
        post "/api/v1/auth/forgot-password", params: { email: user.email }
      }.to change { ActionMailer::Base.deliveries.count }.by(1)

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)["message"]).to include("reset link has been sent")
      
      user.reload
      expect(user.reset_password_token).not_to be_nil
      
      email = ActionMailer::Base.deliveries.last
      expect(email.to).to include(user.email)
      expect(email.subject).to eq("Reset your ApiNest Password")
      expect(email.body.encoded).to include(user.reset_password_token)
    end

    it "still returns success message if user does not exist (for security)" do
      expect {
        post "/api/v1/auth/forgot-password", params: { email: 'nonexistent@example.com' }
      }.not_to change { ActionMailer::Base.deliveries.count }

      expect(response).to have_http_status(:ok)
    end
  end

  describe "POST /api/v1/auth/reset-password" do
    let!(:user) { User.create!(valid_attributes) }
    
    before do
      user.generate_reset_password_token!
    end

    it "updates the password with a valid token" do
      post "/api/v1/auth/reset-password", params: { token: user.reset_password_token, password: 'newpassword123' }
      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)["message"]).to include("Password updated successfully")
      
      user.reload
      expect(user.authenticate('newpassword123')).to be_truthy
      expect(user.reset_password_token).to be_nil
    end

    it "fails with an invalid token" do
      post "/api/v1/auth/reset-password", params: { token: 'invalidtoken', password: 'newpassword123' }
      expect(response).to have_http_status(:unprocessable_entity)
      expect(JSON.parse(response.body)["error"]).to include("Invalid or expired reset token")
    end

    it "fails with too short password" do
      post "/api/v1/auth/reset-password", params: { token: user.reset_password_token, password: '123' }
      expect(response).to have_http_status(:unprocessable_entity)
      expect(JSON.parse(response.body)["error"]).to include("Password must be at least 6 characters")
    end
  end
end
