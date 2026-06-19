class CollectionSerializer < Blueprinter::Base
  identifier :id

  fields :name, :description, :workspace_id, :created_at, :updated_at

  association :folders, blueprint: FolderSerializer
  association :requests, blueprint: RequestSerializer
end
