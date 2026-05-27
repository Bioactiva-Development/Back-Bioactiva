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
                    npm install
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
                    file(credentialsId: 'BIOACTIVA-SECRETS', variable: 'ENV_FILE')
                ]) {
                    sh '''
                        cp "$ENV_FILE" .env

                        docker compose \
                            -p back-bioactiva \
                            -f docker-compose.yml \
                            --profile prod \
                            down

                        docker compose \
                            -p back-bioactiva \
                            -f docker-compose.yml \
                            --profile prod \
                            up -d --build bioactiva-backend-prod
                    '''
                }
            }
        }
    }
}