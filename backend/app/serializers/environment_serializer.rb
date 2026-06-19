class EnvironmentSerializer < Blueprinter::Base
  identifier :id

  fields :name, :workspace_id, :is_active, :created_at, :updated_at

  association :environment_variables, blueprint: EnvironmentVariableSerializer
end
