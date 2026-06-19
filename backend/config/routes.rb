Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    namespace :v1 do
      scope :auth, controller: :auth do
        post :register
        post :login
        post :refresh
        post :logout
        get :confirm, action: :confirm_email
        post "forgot-password", action: :forgot_password
        post "reset-password", action: :reset_password
        get :me
        patch :profile, action: :update_profile
      end

      resources :workspaces, only: [:index, :show, :create, :update, :destroy] do
        get :stats, on: :member
      end

      resources :collections do
        member do
          post :duplicate
          get :docs
        end
        collection do
          post :import
        end
      end

      resources :folders, only: [:create, :update, :destroy]
      
      resources :requests, only: [:create, :update, :destroy] do
        collection do
          post :send_request
        end
      end

      resources :request_histories, only: [:index, :destroy] do
        collection do
          delete :clear_all
        end
      end

      resources :environments do
        member do
          post :activate
        end
        resources :environment_variables, only: [:create, :update, :destroy]
      end

      resources :api_monitors do
        member do
          post :toggle_active
        end
      end

      resources :notifications, only: [:index] do
        member do
          post :read
        end
      end

    end
  end
end
