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
                }
            }
            environment {
                scannerHome = tool 'SonarScanner'
            }
            steps {
                withSonarQubeEnv('SonarQube-Server') {
                    sh "${scannerHome}/bin/sonar-scanner"
                }
            }
        }
        
        stage('Quality Gate') {
            steps {
                timeout(time: 1, unit: 'HOURS') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        // stage('Deploy (Docker Compose)') {
        //     steps {
        //         withCredentials([string(credentialsId: 'KEY1', variable: 'KEY1')]) {
        //             sh '''
        //                 docker compose down
        //                 docker compose up -d --build
        //             '''
        //         }
        //     }
        // }
    }
}