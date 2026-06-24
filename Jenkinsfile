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
                    # corepack enable necesita escribir el shim de pnpm; en
                    # /usr/local/bin requiere root (EACCES como usuario de
                    # Jenkins). Se instala en el workspace y se agrega al PATH
                    # para no correr el contenedor como root ni dejar archivos
                    # con dueño root que rompan el checkout del siguiente build.
                    export COREPACK_HOME="$WORKSPACE/.corepack"
                    mkdir -p "$WORKSPACE/.pnpm-bin" "$COREPACK_HOME"
                    corepack enable --install-directory "$WORKSPACE/.pnpm-bin"
                    export PATH="$WORKSPACE/.pnpm-bin:$PATH"
                    pnpm install --frozen-lockfile
                    pnpm run test:cov
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
                        # Se baja el stack, se levanta y se inyecta el service
                        # account de reCAPTCHA con `docker cp` directo al contenedor.
                        # Evita bind-mounts de archivo, frágiles cuando el daemon
                        # no comparte el filesystem del workspace de Jenkins.
                        BIOACTIVA_ENV_FILE="$ENV_FILE" docker compose \
                            -p back-bioactiva-testing \
                            -f docker-compose.yml \
                            --env-file "$ENV_FILE" \
                            --profile testing \
                            down

                        cat "$RECAPTCHA_FILE"

                        BIOACTIVA_ENV_FILE="$ENV_FILE" docker compose \
                            -p back-bioactiva-testing \
                            -f docker-compose.yml \
                            --env-file "$ENV_FILE" \
                            --profile testing \
                            up -d --build

                        docker cp "$RECAPTCHA_FILE" bioactiva-backend-prod:/app/credentials/recaptcha-account.json
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
                        # Se baja el stack, se levanta y se inyecta el service
                        # account de reCAPTCHA con `docker cp` directo al contenedor.
                        # Evita bind-mounts de archivo, frágiles cuando el daemon
                        # no comparte el filesystem del workspace de Jenkins.
                        BIOACTIVA_ENV_FILE="$ENV_FILE" docker compose \
                            -p back-bioactiva-development \
                            -f docker-compose.yml \
                            --env-file "$ENV_FILE" \
                            --profile development \
                            down

                        cat "$RECAPTCHA_FILE"

                        BIOACTIVA_ENV_FILE="$ENV_FILE" docker compose \
                            -p back-bioactiva-development \
                            -f docker-compose.yml \
                            --env-file "$ENV_FILE" \
                            --profile development \
                            up -d --build

                        docker cp "$RECAPTCHA_FILE" bioactiva-backend-development:/app/credentials/recaptcha-account.json
                    '''
                }
            }
        }
    }
}
