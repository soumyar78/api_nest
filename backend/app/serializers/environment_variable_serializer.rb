class EnvironmentVariableSerializer < Blueprinter::Base
  identifier :id

  fields :environment_id, :key, :value, :secret, :created_at, :updated_at
end
