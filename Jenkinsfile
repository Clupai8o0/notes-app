pipeline {
  agent any

  environment {
    DOCKER_COMPOSE_FILE = 'docker-compose.yml'
    DOCKER_COMPOSE_PROD_FILE = 'docker-compose.prod.yml'
  }

  options {
    skipStagesAfterUnstable()
    ansiColor('xterm')
  }

  stages {
    stage('Checkout Code') {
      steps {
        git 'https://github.com/Clupai8o0/notes-app.git'
      }
    }

    stage('Lint and Test Backend') {
      steps {
        dir('server') {
          sh 'npm install'
          sh 'npm run lint'
          sh 'npm test'
        }
      }
    }

    stage('Lint and Test Frontend') {
      steps {
        dir('client') {
          sh 'npm install'
          sh 'npm run lint'
          sh 'npm test'
        }
      }
    }

    stage('Build Docker Images') {
      steps {
        sh 'docker-compose -f $DOCKER_COMPOSE_FILE -f $DOCKER_COMPOSE_PROD_FILE build'
      }
    }

    stage('Deploy to Staging (Local or EC2)') {
      steps {
        sh 'docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d'
      }
    }
  }

  post {
    success {
      echo '✅ CI/CD Pipeline completed successfully'
    },
    failure {
      echo '❌ Pipeline failed. Check logs for details'
    }
  }
}