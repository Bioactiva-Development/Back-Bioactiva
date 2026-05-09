pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build') {
            steps {
                sh 'echo "Construyendo proyecto..."'
            }
        }

        stage('Test') {
            steps {
                sh 'echo "Corriendo tests..."'
            }
        }

        stage('Deploy') {
            steps {
                sh 'echo "Desplegando..."'
            }
        }
    }

    post {
        success {
            echo '✅ Pipeline ejecutado correctamente'
        }
        failure {
            echo '❌ Pipeline falló'
        }
    }
}