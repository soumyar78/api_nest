require 'rails_helper'

RSpec.describe "Api::V1::Environments", type: :request do
  let(:user) { User.create!(name: 'John Doe', email: 'john@example.com', password: 'password123', confirmed_at: Time.current) }
  let(:workspace) { user.workspaces.first }
  
  let(:auth_headers) do
    token = JwtService.encode({ user_id: user.id })
    { 'Authorization' => "Bearer #{token}" }
  end

  describe "Environments CRUD" do
    it "creates environments and variables, and activates environment" do
      # 1. Create Environment
      post "/api/v1/environments", params: { workspace_id: workspace.id, name: "Production" }, headers: auth_headers
      expect(response).to have_http_status(:created)
      
      env_id = JSON.parse(response.body)['environment']['id']

      # 2. Add variable
      post "/api/v1/environments/#{env_id}/environment_variables", params: { key: "base_url", value: "https://api.production.com" }, headers: auth_headers
      expect(response).to have_http_status(:created)
      expect(EnvironmentVariable.find_by(environment_id: env_id, key: "base_url").value).to eq("https://api.production.com")

      # 3. Activate Environment
      post "/api/v1/environments/#{env_id}/activate", headers: auth_headers
      expect(response).to have_http_status(:ok)
      expect(Environment.find(env_id).is_active).to be true
    end
  end
end
