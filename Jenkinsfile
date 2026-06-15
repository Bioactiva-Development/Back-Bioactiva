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
            when {
                branch 'testing'
            }
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
            when {
                branch 'testing'
            }
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
            when {
                branch 'testing'
            }
            steps {
                timeout(time: 1, unit: 'HOURS') {
                    waitForQualityGate abortPipeline: false
                }
            }
        }

        stage('Deploy Testing (Docker Compose)') {
            when {
                branch 'testing'
            }
            steps {
                withCredentials([
                    file(credentialsId: 'BIOACTIVA_SECRETS_BACKEND_TEST', variable: 'ENV_FILE'),
                    file(credentialsId: 'BIOACTIVA_SECRETS_RECAPTCHA_JSON', variable: 'RECAPTCHA_FILE')
                ]) {
                    sh '''
                        # Limpia restos con dueño root que el daemon de Docker pudo
                        # crear como bind-mount cuando el archivo fuente no existía
                        # (jenkins no puede borrarlos sin privilegios).
                        docker run --rm -v "$WORKSPACE":/w -w /w alpine sh -c 'rm -rf credentials'
                        mkdir -p credentials
                        install -m 600 "$RECAPTCHA_FILE" credentials/recaptcha-account.json
                        BIOACTIVA_ENV_FILE="$ENV_FILE" docker compose \
                            -p back-bioactiva-testing \
                            -f docker-compose.yml \
                            --env-file "$ENV_FILE" \
                            --profile testing \
                            down

                        BIOACTIVA_ENV_FILE="$ENV_FILE" docker compose \
                            -p back-bioactiva-testing \
                            -f docker-compose.yml \
                            --env-file "$ENV_FILE" \
                            --profile testing \
                            up -d --build
                    '''
                }
            }
        }

        stage('Deploy Development (Docker Compose)') {
            when {
                branch 'development'
            }
            steps {
                withCredentials([
                    file(credentialsId: 'BIOACTIVA_SECRETS_BACKEND_DEV', variable: 'ENV_FILE'),
                    file(credentialsId: 'BIOACTIVA_SECRETS_RECAPTCHA_JSON', variable: 'RECAPTCHA_FILE')
                ]) {
                    sh '''
                        # Limpia restos con dueño root que el daemon de Docker pudo
                        # crear como bind-mount cuando el archivo fuente no existía
                        # (jenkins no puede borrarlos sin privilegios).
                        docker run --rm -v "$WORKSPACE":/w -w /w alpine sh -c 'rm -rf credentials'
                        mkdir -p credentials
                        install -m 600 "$RECAPTCHA_FILE" credentials/recaptcha-account.json
                        BIOACTIVA_ENV_FILE="$ENV_FILE" docker compose \
                            -p back-bioactiva-development \
                            -f docker-compose.yml \
                            --env-file "$ENV_FILE" \
                            --profile development \
                            down

                        BIOACTIVA_ENV_FILE="$ENV_FILE" docker compose \
                            -p back-bioactiva-development \
                            -f docker-compose.yml \
                            --env-file "$ENV_FILE" \
                            --profile development \
                            up -d --build
                    '''
                }
            }
        }
    }
}
