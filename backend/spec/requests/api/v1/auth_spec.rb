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
end
