class FolderSerializer < Blueprinter::Base
  identifier :id

  fields :name, :collection_id, :parent_id, :created_at, :updated_at

  association :children, blueprint: FolderSerializer
  association :requests, blueprint: RequestSerializer
end
