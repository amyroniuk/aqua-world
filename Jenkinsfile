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
        sh 'git config --global user.email "jenkins@jwt.ovh"'
        sh 'git config --global user.name "jenkins"'
        sh 'git status'
        sh 'git checkout master'
        sh 'git status'
        sh 'git commit -am "Build"'
        sshagent (credentials: ['jenkins-github']) {
          sh 'git push origin main'
        }
      }
    }
  }
}