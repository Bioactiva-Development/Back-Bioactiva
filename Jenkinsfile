pipeline {
    agent any

    options {
        buildDiscarder(logRotator(numToKeepStr: '5'))
    }

    stages {

        stage('Checkout Repo') {
            steps {
                checkout scm
            }
        }

        stage('Test') {
            agent {
                docker {
                    image 'node:22-slim'
                    reuseNode true
                }
            }

            steps {
                sh '''
                    npm ci
                    npm run test:cov
                '''
            }
        }

        stage('SonarQube Analysis') {
            agent {
                docker {
                    image 'node:22-slim'
                    reuseNode true
                    args '-u root'
                }
            }

            environment {
                scannerHome = tool 'SonarScanner'
            }

            steps {
                withSonarQubeEnv('SonarQube-Server') {
                    sh '''
                        apt-get update && apt-get install -y openjdk-17-jre-headless
                        ${scannerHome}/bin/sonar-scanner
                    '''
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 1, unit: 'HOURS') {
                    waitForQualityGate abortPipeline: false
                }
            }
        }

        stage('Deploy (Docker Compose)') {
            steps {

                withCredentials([
                    string(credentialsId: 'FRONTED_BIOACTIVA', variable: 'FRONTED_BIOACTIVA'),
                    string(credentialsId: 'DB_BIOACTIVA', variable: 'DB_BIOACTIVA'),
                    string(credentialsId: 'REDIS_BIOACTIVA', variable: 'REDIS_BIOACTIVA'),
                    string(credentialsId: 'JWT_SECRET_BIOACTIVA', variable: 'JWT_SECRET'),
                    string(credentialsId: 'JWT_EXPIRES_IN_BIOACTIVA', variable: 'JWT_EXPIRES_IN'),
                    string(credentialsId: 'JWT_REFRESH_SECRET_BIOACTIVA', variable: 'JWT_REFRESH_SECRET'),
                    string(credentialsId: 'JWT_REFRESH_EXPIRES_IN_BIOACTIVA', variable: 'JWT_REFRESH_EXPIRES_IN'),
                    string(credentialsId: 'JWT_ISSUER_BIOACTIVA', variable: 'JWT_ISSUER'),
                    string(credentialsId: 'JWT_AUDIENCE_BIOACTIVA', variable: 'JWT_AUDIENCE'),
                    string(credentialsId: 'BCRYPT_SALT_ROUNDS_BIOACTIVA', variable: 'BCRYPT_SALT_ROUNDS'),
                    string(credentialsId: 'ADMIN_EMAIL_BIOACTIVA', variable: 'ADMIN_EMAIL'),
                    string(credentialsId: 'ADMIN_PASSWORD_BIOACTIVA', variable: 'ADMIN_PASSWORD'),
                    string(credentialsId: 'REFRESH_TOKEN_COOKIE_NAME_BIOACTIVA', variable: 'REFRESH_TOKEN_COOKIE_NAME')
                ]) {

                    sh '''
                        docker compose --profile prod down
                        docker compose --profile prod up -d --build bioactiva-backend-prod
                    '''
                }
            }
        }
    }
}