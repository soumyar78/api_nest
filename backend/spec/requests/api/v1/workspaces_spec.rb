require 'rails_helper'

RSpec.describe "Api::V1::Workspaces", type: :request do
  let(:user) { User.create!(name: 'Jane Doe', email: 'jane@example.com', password: 'password123', confirmed_at: Time.current) }
  let(:other_user) { User.create!(name: 'Bob Smith', email: 'bob@example.com', password: 'password123', confirmed_at: Time.current) }
  
  # User automatically gets a personal workspace via user callback
  let(:personal_workspace) { user.workspaces.first }
  
  let(:auth_headers) do
    token = JwtService.encode({ user_id: user.id })
    { 'Authorization' => "Bearer #{token}" }
  end

  describe "GET /api/v1/workspaces" do
    it "returns list of workspaces belonging only to the current user" do
      # Create another workspace for Jane
      team_ws = Workspace.create!(name: "Jane's Secondary Projects", user: user)

      # Create another workspace not associated with user
      other_ws = Workspace.create!(name: "Bob's Work", user: other_user)

      get "/api/v1/workspaces", headers: auth_headers
      expect(response).to have_http_status(:ok)
      
      json = JSON.parse(response.body)
      workspace_ids = json['workspaces'].map { |w| w['id'] }
      
      expect(workspace_ids).to include(personal_workspace.id)
      expect(workspace_ids).to include(team_ws.id)
      expect(workspace_ids).not_to include(other_ws.id)
    end
  end

  describe "GET /api/v1/workspaces/:id" do
    it "returns workspace details" do
      get "/api/v1/workspaces/#{personal_workspace.id}", headers: auth_headers
      expect(response).to have_http_status(:ok)
      
      json = JSON.parse(response.body)
      expect(json['workspace']['name']).to eq(personal_workspace.name)
    end

    it "prevents accessing workspace owned by another user" do
      other_ws = Workspace.create!(name: "Bob's Work", user: other_user)

      get "/api/v1/workspaces/#{other_ws.id}", headers: auth_headers
      expect(response).to have_http_status(:not_found)
    end
  end

  describe "POST /api/v1/workspaces" do
    it "creates a new workspace linked to user" do
      post "/api/v1/workspaces", params: { name: "New Projects" }, headers: auth_headers
      expect(response).to have_http_status(:created)

      json = JSON.parse(response.body)
      ws_id = json['workspace']['id']
      
      workspace = Workspace.find(ws_id)
      expect(workspace.name).to eq("New Projects")
      expect(workspace.user).to eq(user)
    end
  end

  describe "PUT /api/v1/workspaces/:id" do
    it "allows the owner to update settings" do
      put "/api/v1/workspaces/#{personal_workspace.id}", params: { name: "Renamed Personal" }, headers: auth_headers
      expect(response).to have_http_status(:ok)
      expect(personal_workspace.reload.name).to eq("Renamed Personal")
    end

    it "denies updates to another user's workspace" do
      bob_ws = Workspace.create!(name: "Bob's Work", user: other_user)

      put "/api/v1/workspaces/#{bob_ws.id}", params: { name: "Hacked Name" }, headers: auth_headers
      expect(response).to have_http_status(:not_found)
    end
  end

  describe "DELETE /api/v1/workspaces/:id" do
    it "allows deleting a workspace if they have other workspaces left" do
      extra_ws = Workspace.create!(name: "Jane Extra Work", user: user)

      delete "/api/v1/workspaces/#{extra_ws.id}", headers: auth_headers
      expect(response).to have_http_status(:ok)
      expect(Workspace.find_by(id: extra_ws.id)).to be_nil
    end

    it "prevents deleting the last remaining workspace" do
      delete "/api/v1/workspaces/#{personal_workspace.id}", headers: auth_headers
      expect(response).to have_http_status(:forbidden)
      expect(personal_workspace.reload).to be_present
    end
  end

  describe "GET /api/v1/workspaces/:id/stats" do
    it "returns stats overview" do
      get "/api/v1/workspaces/#{personal_workspace.id}/stats", headers: auth_headers
      expect(response).to have_http_status(:ok)
      
      json = JSON.parse(response.body)
      expect(json['stats']).to have_key('total_collections')
    end
  end
end
