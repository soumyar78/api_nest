# Seed file for ApiNest development

puts "Seeding database..."

# 1. Create a default developer user (if not exists)
user = User.find_or_initialize_by(email: "user@apinest.com")
if user.new_record?
  user.name = "John Developer"
  user.password = "password123"
  user.confirmed_at = Time.current
  user.save!
  puts "Created dev user: user@apinest.com / password123"
else
  puts "Dev user already exists."
end

# Use John's default workspace
workspace = user.workspaces.first
if workspace.nil?
  workspace = Workspace.create!(name: "John's Workspace", user: user)
end

# 2. Seed Environments
dev_env = workspace.environments.find_or_create_by!(name: "Development") { |e| e.is_active = true }
staging_env = workspace.environments.find_or_create_by!(name: "Staging")
prod_env = workspace.environments.find_or_create_by!(name: "Production")

dev_env.environment_variables.find_or_create_by!(key: "base_url") { |v| v.value = "https://jsonplaceholder.typicode.com" }
dev_env.environment_variables.find_or_create_by!(key: "api_key") { |v| v.value = "dev_secret_key_12345" }
dev_env.environment_variables.find_or_create_by!(key: "token") { |v| v.value = "dev_bearer_token_abc" }

staging_env.environment_variables.find_or_create_by!(key: "base_url") { |v| v.value = "https://api.staging.nest.com" }
staging_env.environment_variables.find_or_create_by!(key: "api_key") { |v| v.value = "staging_secret_key_67890" }

prod_env.environment_variables.find_or_create_by!(key: "base_url") { |v| v.value = "https://api.apinest.com" }
prod_env.environment_variables.find_or_create_by!(key: "api_key") { |v| v.value = "prod_secret_key_abcde" }
puts "Environments and variables seeded."

# 3. Seed Collections & Folders
collection = workspace.collections.find_or_create_by!(name: "JSONPlaceholder API") do |c|
  c.description = "Mock HTTP request collections referencing JSONPlaceholder test API endpoints."
end

users_folder = collection.folders.find_or_create_by!(name: "Users Module")
posts_folder = collection.folders.find_or_create_by!(name: "Posts Module")

# 4. Seed Requests inside Folders
users_folder.requests.find_or_create_by!(name: "Get All Users") do |r|
  r.method = "GET"
  r.url = "{{base_url}}/users"
  r.headers = [{ key: "Accept", value: "application/json", enabled: true }]
  r.workspace = workspace
  r.collection = collection
end

users_folder.requests.find_or_create_by!(name: "Get Single User (1)") do |r|
  r.method = "GET"
  r.url = "{{base_url}}/users/1"
  r.workspace = workspace
  r.collection = collection
end

posts_folder.requests.find_or_create_by!(name: "Create New Post") do |r|
  r.method = "POST"
  r.url = "{{base_url}}/posts"
  r.body_type = "json"
  r.body_content = '{"title": "Hello ApiNest", "body": "Testing platform", "userId": 1}'
  r.headers = [{ key: "Content-Type", value: "application/json", enabled: true }]
  r.workspace = workspace
  r.collection = collection
end

posts_folder.requests.find_or_create_by!(name: "Update Post (PUT)") do |r|
  r.method = "PUT"
  r.url = "{{base_url}}/posts/1"
  r.body_type = "json"
  r.body_content = '{"id": 1, "title": "Updated title", "body": "Updated details", "userId": 1}'
  r.workspace = workspace
  r.collection = collection
end

posts_folder.requests.find_or_create_by!(name: "Delete Post") do |r|
  r.method = "DELETE"
  r.url = "{{base_url}}/posts/1"
  r.workspace = workspace
  r.collection = collection
end
puts "Collections, Folders, and Requests seeded."

# 5. Seed Request History
if workspace.request_histories.count == 0
  [
    { method: "GET", url: "https://jsonplaceholder.typicode.com/users", status: 200, latency: 154, size: 5410 },
    { method: "GET", url: "https://jsonplaceholder.typicode.com/users/1", status: 200, latency: 89, size: 650 },
    { method: "POST", url: "https://jsonplaceholder.typicode.com/posts", status: 201, latency: 245, size: 120 },
    { method: "DELETE", url: "https://jsonplaceholder.typicode.com/posts/1", status: 200, latency: 98, size: 2 },
    { method: "GET", url: "https://jsonplaceholder.typicode.com/invalid-path", status: 404, latency: 76, size: 85 }
  ].each_with_index do |h, idx|
    workspace.request_histories.create!(
      user: user,
      name: "Mock Run #{idx + 1}",
      method: h[:method],
      url: h[:url],
      response_status: h[:status],
      response_time_ms: h[:latency],
      response_size_bytes: h[:size],
      response_body: h[:status] == 200 ? '{"success": true}' : '{"error": "Not Found"}',
      response_headers: { "Content-Type" => "application/json", "Server" => "cloudflare" },
      created_at: Time.current - idx.hours
    )
  end
  puts "Request histories seeded."
end

# 6. Seed API Monitors
monitor = workspace.api_monitors.find_or_create_by!(name: "JSONPlaceholder Healthcheck") do |m|
  m.url = "https://jsonplaceholder.typicode.com/posts/1"
  m.method = "GET"
  m.interval_minutes = 10
end

if monitor.api_monitor_logs.count == 0
  # Seed last 10 logs
  10.times do |i|
    monitor.api_monitor_logs.create!(
      response_status: 200,
      response_time_ms: rand(50..180),
      success: true,
      created_at: Time.current - (i * 10).minutes
    )
  end
  monitor.update!(last_checked_at: Time.current)
  puts "API Monitors and logs seeded."
end

puts "Database seeding complete!"
