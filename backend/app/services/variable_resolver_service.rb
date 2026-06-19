class VariableResolverService
  def self.resolve(content, workspace)
    return content if content.blank? || workspace.nil?

    # Find the active environment for this workspace
    active_env = workspace.environments.find_by(is_active: true)
    return content if active_env.nil?

    # Fetch variables as a hash map of key => value
    variables = active_env.environment_variables.pluck(:key, :value).to_h

    # Replace all {{variable_name}} with their values
    resolved = content.dup
    resolved.gsub!(/\{\{\s*([a-zA-Z0-9_-]+)\s*\}\}/) do |match|
      key = $1
      variables.key?(key) ? variables[key].to_s : match
    end

    resolved
  end

  # Resolves variables recursively inside a deep structure (like Hash or Array)
  def self.resolve_structure(structure, workspace)
    case structure
    when String
      resolve(structure, workspace)
    when Hash
      structure.transform_values { |value| resolve_structure(value, workspace) }
    when Array
      structure.map { |item| resolve_structure(item, workspace) }
    else
      structure
    end
  end
end
