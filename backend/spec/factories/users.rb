FactoryBot.define do
  factory :user do
    email { "MyString" }
    password_digest { "MyString" }
    name { "MyString" }
    confirmed_at { "2026-06-18 23:55:42" }
    confirmation_token { "MyString" }
    reset_password_token { "MyString" }
    reset_password_sent_at { "2026-06-18 23:55:42" }
    refresh_token { "MyString" }
    refresh_token_expires_at { "2026-06-18 23:55:42" }
  end
end
