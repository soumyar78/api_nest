module Api
  module V1
    class CollectionsController < ApiController
      # GET /api/v1/collections
      def index
        workspace = current_user.workspaces.find(params[:workspace_id])
        collections = workspace.collections.order(created_at: :asc)
        render json: { collections: CollectionSerializer.render_as_hash(collections) }, status: :ok
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Workspace not found" }, status: :not_found
      end

      # GET /api/v1/collections/:id
      def show
        collection = Collection.joins(:workspace).where(workspaces: { user_id: current_user.id }).find(params[:id])
        render json: { collection: CollectionSerializer.render_as_hash(collection) }, status: :ok
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Collection not found" }, status: :not_found
      end

      # POST /api/v1/collections
      def create
        workspace = current_user.workspaces.find(params[:workspace_id])
        collection = workspace.collections.new(collection_params)

        if collection.save
          render json: { collection: CollectionSerializer.render_as_hash(collection) }, status: :created
        else
          render json: { errors: collection.errors.full_messages }, status: :unprocessable_entity
        end
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Workspace not found" }, status: :not_found
      end

      # PUT /api/v1/collections/:id
      def update
        collection = Collection.joins(:workspace).where(workspaces: { user_id: current_user.id }).find(params[:id])

        if collection.update(collection_params)
          render json: { collection: CollectionSerializer.render_as_hash(collection) }, status: :ok
        else
          render json: { errors: collection.errors.full_messages }, status: :unprocessable_entity
        end
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Collection not found" }, status: :not_found
      end

      # DELETE /api/v1/collections/:id
      def destroy
        collection = Collection.joins(:workspace).where(workspaces: { user_id: current_user.id }).find(params[:id])
        collection.destroy
        render json: { message: "Collection deleted successfully" }, status: :ok
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Collection not found" }, status: :not_found
      end

      # POST /api/v1/collections/:id/duplicate
      def duplicate
        collection = Collection.joins(:workspace).where(workspaces: { user_id: current_user.id }).find(params[:id])
        
        new_collection = nil
        Collection.transaction do
          new_collection = collection.dup
          new_collection.name = "#{collection.name} (Copy)"
          new_collection.save!

          # Duplicate folders (preserving hierarchy)
          folder_mappings = {} # original_id => new_folder
          
          # We resolve root folders first, then children
          all_folders = collection.folders.order(:parent_id)
          all_folders.each do |f|
            new_folder = f.dup
            new_folder.collection = new_collection
            
            if f.parent_id.present?
              parent_folder = folder_mappings[f.parent_id]
              new_folder.parent_id = parent_folder&.id
            end
            
            new_folder.save!
            folder_mappings[f.id] = new_folder
          end

          # Duplicate requests
          collection.requests.each do |req|
            new_req = req.dup
            new_req.collection = new_collection
            if req.folder_id.present?
              new_folder = folder_mappings[req.folder_id]
              new_req.folder_id = new_folder&.id
            end
            new_req.save!
          end
        end

        render json: { collection: CollectionSerializer.render_as_hash(new_collection) }, status: :created
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Collection not found" }, status: :not_found
      end

      # GET /api/v1/collections/:id/docs
      def docs
        collection = Collection.joins(:workspace).where(workspaces: { user_id: current_user.id }).find(params[:id])
        
        # Build document generation payload
        doc_data = {
          collection_name: collection.name,
          description: collection.description,
          endpoints: []
        }

        # Recursively list requests
        collection.requests.each do |req|
          doc_data[:endpoints] << {
            name: req.name,
            method: req.method,
            url: req.url,
            headers: req.headers,
            params: req.params,
            body_type: req.body_type,
            body_content: req.body_content,
            auth_type: req.auth_type
          }
        end

        render json: doc_data, status: :ok
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Collection not found" }, status: :not_found
      end

      # POST /api/v1/collections/import
      def import
        workspace = current_user.workspaces.find(params[:workspace_id])
        import_data = params[:file_data]
        
        # Simple parser for Postman collection format or ApiNest format
        # If it is a Postman collection (it has "info" and "item")
        parsed = nil
        begin
          parsed = JSON.parse(import_data) if import_data.is_a?(String)
          parsed ||= import_data
        rescue
          return render json: { error: "Invalid JSON format" }, status: :unprocessable_entity
        end

        if parsed.blank? || (!parsed.key?("info") && !parsed.key?("name"))
          return render json: { error: "Unsupported import format" }, status: :unprocessable_entity
        end

        collection = nil
        Collection.transaction do
          name = parsed.dig("info", "name") || parsed["name"] || "Imported Collection"
          desc = parsed.dig("info", "description") || parsed["description"]
          collection = workspace.collections.create!(name: name, description: desc)

          # Parse items (which could be folders or requests)
          items = parsed["item"] || parsed["requests"] || []
          import_items(items, collection, nil, workspace)
        end

        render json: { collection: CollectionSerializer.render_as_hash(collection) }, status: :created
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Workspace not found" }, status: :not_found
      rescue => e
        render json: { error: "Import failed: #{e.message}" }, status: :unprocessable_entity
      end

      private

      def collection_params
        params.permit(:name, :description)
      end

      # Helper to import items recursively
      def import_items(items, collection, parent_folder, workspace)
        items.each do |item|
          if item.key?("item")
            # This is a folder
            folder = collection.folders.create!(
              name: item["name"] || "Folder",
              parent_id: parent_folder&.id
            )
            import_items(item["item"], collection, folder, workspace)
          else
            # This is a request
            # For Postman request format
            req_info = item["request"] || item
            
            method = req_info["method"] || "GET"
            
            # Postman URL can be a string or object
            raw_url = ""
            if req_info["url"].is_a?(Hash)
              raw_url = req_info.dig("url", "raw") || ""
            else
              raw_url = req_info["url"] || ""
            end

            # Postman headers
            headers = []
            postman_headers = req_info["header"] || []
            postman_headers.each do |h|
              headers << { "key" => h["key"], "value" => h["value"], "enabled" => h["disabled"] != true }
            end

            # Postman body
            body_type = "none"
            body_content = ""
            if req_info.dig("body", "mode") == "raw"
              body_type = "raw"
              body_content = req_info.dig("body", "raw") || ""
              # Try to check if raw type is JSON
              if req_info.dig("body", "options", "raw", "language") == "json"
                body_type = "json"
              end
            end

            collection.requests.create!(
              name: item["name"] || "API Request",
              method: method,
              url: raw_url,
              headers: headers,
              params: [],
              body_type: body_type,
              body_content: body_content,
              auth_type: "none",
              folder: parent_folder,
              workspace: workspace
            )
          end
        end
      end
    end
  end
end
