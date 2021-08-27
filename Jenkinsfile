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
        echo 'Build lib...'
        sh 'git config --global user.name "Jenkins"'
        sh 'git config --global user.email "jenkins@jwt.ovh"'
        sh 'git checkout main'
        sshagent (credentials: ['jenkins-github']) {
          sh 'git pull'
        }
        sh 'npm run build'
        sh 'git commit -am "Build lib"'
        sshagent (credentials: ['jenkins-github']) {
          sh 'git push origin main'
        }
      }
    }
  }
}