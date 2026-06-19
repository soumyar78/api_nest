require 'rails_helper'

RSpec.describe "Api::V1::Collections & Folders & Requests", type: :request do
  let(:user) { User.create!(name: 'John Doe', email: 'john@example.com', password: 'password123', confirmed_at: Time.current) }
  let(:workspace) { user.workspaces.first }
  
  let(:auth_headers) do
    token = JwtService.encode({ user_id: user.id })
    { 'Authorization' => "Bearer #{token}" }
  end

  describe "Collections CRUD" do
    it "creates, updates, and duplicates collections" do
      # 1. Create Collection
      post "/api/v1/collections", params: { workspace_id: workspace.id, name: "API V1 Specs", description: "Internal API endpoints" }, headers: auth_headers
      expect(response).to have_http_status(:created)
      
      collection_id = JSON.parse(response.body)['collection']['id']
      expect(collection_id).to be_present

      # 2. Update Collection
      put "/api/v1/collections/#{collection_id}", params: { name: "API V2 Specs" }, headers: auth_headers
      expect(response).to have_http_status(:ok)
      expect(Collection.find(collection_id).name).to eq("API V2 Specs")

      # 3. Duplicate Collection
      post "/api/v1/collections/#{collection_id}/duplicate", headers: auth_headers
      expect(response).to have_http_status(:created)
      
      dup_json = JSON.parse(response.body)
      expect(dup_json['collection']['name']).to eq("API V2 Specs (Copy)")
    end
  end

  describe "Folders CRUD" do
    let!(:collection) { Collection.create!(name: "Test Col", workspace: workspace) }

    it "creates and deletes folders" do
      # 1. Create Folder
      post "/api/v1/folders", params: { collection_id: collection.id, name: "Users Resource" }, headers: auth_headers
      expect(response).to have_http_status(:created)
      
      folder_id = JSON.parse(response.body)['folder']['id']
      expect(Folder.find(folder_id).name).to eq("Users Resource")

      # 2. Delete Folder
      delete "/api/v1/folders/#{folder_id}", headers: auth_headers
      expect(response).to have_http_status(:ok)
      expect(Folder.find_by(id: folder_id)).to be_nil
    end
  end

  describe "Requests & Proxy Execution" do
    let!(:collection) { Collection.create!(name: "Test Col", workspace: workspace) }
    
    it "creates a request and executes it via proxy" do
      # 1. Create request
      post "/api/v1/requests", params: { 
        collection_id: collection.id, 
        name: "Get Users", 
        method: "GET", 
        url: "https://jsonplaceholder.typicode.com/users",
        headers: [{ key: "Accept", value: "application/json", enabled: true }]
      }, headers: auth_headers
      expect(response).to have_http_status(:created)
      
      req_id = JSON.parse(response.body)['request']['id']

      # 2. Proxy request send execution
      post "/api/v1/requests/send_request", params: {
        workspace_id: workspace.id,
        request_id: req_id,
        method: "GET",
        url: "https://jsonplaceholder.typicode.com/users/1",
        headers: [{ key: "Accept", value: "application/json", enabled: true }]
      }, headers: auth_headers
      expect(response).to have_http_status(:ok)
      
      res_json = JSON.parse(response.body)
      expect(res_json).to have_key('response')
      expect(res_json['response']).to have_key('status')
      expect(res_json).to have_key('history')
    end
  end
end
