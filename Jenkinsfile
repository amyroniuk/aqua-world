pipeline {
  agent any

  tools {
    nodejs "node15"
  }

  stages {
    stage('Install') {
      steps {
        sh 'npm install'
      }
    }

    stage('Test') {
      steps {
        sh 'npm test'
      }
    }

    stage('Build') {
      steps {
        sh 'npm run build'
        sh 'git add .'
        sh 'git commit -m "Build"'
        sshagent (credentials: ['jenkins-github']) {
          sh 'git push'
        }
      }
    }
  }
}