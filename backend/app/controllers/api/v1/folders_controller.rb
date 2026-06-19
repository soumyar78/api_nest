module Api
  module V1
    class FoldersController < ApiController
      # POST /api/v1/folders
      def create
        collection = Collection.joins(:workspace).where(workspaces: { user_id: current_user.id }).find(params[:collection_id])
        folder = collection.folders.new(folder_params)

        if folder.save
          render json: { folder: FolderSerializer.render_as_hash(folder) }, status: :created
        else
          render json: { errors: folder.errors.full_messages }, status: :unprocessable_entity
        end
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Collection not found" }, status: :not_found
      end

      # PUT /api/v1/folders/:id
      def update
        folder = Folder.joins(collection: :workspace).where(workspaces: { user_id: current_user.id }).find(params[:id])

        if folder.update(folder_params)
          render json: { folder: FolderSerializer.render_as_hash(folder) }, status: :ok
        else
          render json: { errors: folder.errors.full_messages }, status: :unprocessable_entity
        end
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Folder not found" }, status: :not_found
      end

      # DELETE /api/v1/folders/:id
      def destroy
        folder = Folder.joins(collection: :workspace).where(workspaces: { user_id: current_user.id }).find(params[:id])
        folder.destroy
        render json: { message: "Folder deleted successfully" }, status: :ok
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Folder not found" }, status: :not_found
      end

      private

      def folder_params
        params.permit(:name, :parent_id)
      end
    end
  end
end
