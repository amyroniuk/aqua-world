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
        sh 'git config --global user.name "Jenkins"'
        sh 'git config --global user.email "jenkins@jwt.ovh"'
        sh 'git checkout main'
        sh 'npm run build'
        sh 'git commit -am "Build lib"'
        sshagent (credentials: ['jenkins-github']) {
          sh 'git push origin main'
        }
      }
    }
  }
}