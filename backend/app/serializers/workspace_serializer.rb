class WorkspaceSerializer < Blueprinter::Base
  identifier :id

  fields :name, :user_id, :created_at, :updated_at
end
