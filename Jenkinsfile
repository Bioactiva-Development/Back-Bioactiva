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
                    string(credentialsId: 'REDIS_BIOACTIVA', variable: 'REDIS_BIOACTIVA')
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