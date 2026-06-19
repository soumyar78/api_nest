require 'rails_helper'

RSpec.describe "Api::V1::ApiMonitors", type: :request do
  let(:user) { User.create!(name: 'John Doe', email: 'john@example.com', password: 'password123', confirmed_at: Time.current) }
  let(:workspace) { user.workspaces.first }
  
  let(:auth_headers) do
    token = JwtService.encode({ user_id: user.id })
    { 'Authorization' => "Bearer #{token}" }
  end

  describe "API Monitors CRUD" do
    it "creates and toggles API monitors" do
      # 1. Create Monitor
      post "/api/v1/api_monitors", params: { workspace_id: workspace.id, name: "Google Check", url: "https://google.com", method: "GET", interval_minutes: 5 }, headers: auth_headers
      expect(response).to have_http_status(:created)
      
      monitor_id = JSON.parse(response.body)['api_monitor']['id']

      # 2. Toggle Active
      post "/api/v1/api_monitors/#{monitor_id}/toggle_active", headers: auth_headers
      expect(response).to have_http_status(:ok)
      expect(ApiMonitor.find(monitor_id).is_active).to be false
    end
  end
end
