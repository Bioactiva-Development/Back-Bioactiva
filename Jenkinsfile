node {
  stage('SCM') {
    checkout scm
  }

  stage('Install') {
    sh 'npm install'
  }

  stage('Test & Coverage') {
    sh 'npm run test -- --coverage --coverageReporters=lcov'
  }

  stage('SonarQube Analysis') {
    def scannerHome = tool 'SonarScanner'
    withSonarQubeEnv() {
      sh "${scannerHome}/bin/sonar-scanner"
    }
  }
}