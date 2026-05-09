pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install & Test') {
            agent {
                docker {
                    image 'node:22-alpine'
                    reuseNode true
                }
            }
            steps {
                sh 'npm install'
                sh 'npm run test -- --coverage --coverageReporters=lcov'
            }
        }

        stage('SonarQube Analysis') {
            steps {
                def scannerHome = tool 'SonarScanner'
                withSonarQubeEnv('sonarqube-server') {
                    sh "${scannerHome}/bin/sonar-scanner"
                }
            }
        }
    }

    post {
        success {
            echo '✅ Pipeline completado correctamente'
        }
        failure {
            echo '❌ Pipeline falló'
        }
    }
}