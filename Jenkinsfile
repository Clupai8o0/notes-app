pipeline {
  agent any

  environment {
    EC2_HOST = 'ubuntu@3.107.6.105'
    EC2_IP = '3.107.6.105'
    DEPLOY_KEY = 'ec2-user'
    DEPLOY_DIR = '/home/ubuntu/notes-app-prod'
  }

  options {
    skipStagesAfterUnstable()
    ansiColor('xterm')
  }

  stages {
    stage('Checkout Code') {
      steps {
        git branch: 'main', url:  'https://github.com/Clupai8o0/notes-app.git'
      }
    }

    stage('Lint and Test Backend') {
      steps {
        dir('server') {
          sh 'npm install --force'
          sh 'npm run lint'
          sh 'npm test'
        }
      }
    }

    stage('Lint and Test Frontend') {
      steps {
        dir('client') {
          sh 'npm install --force'
          sh 'npm run lint'
          sh 'npm test'
        }
      }
    }

    stage('Build and Push Docker Images') {
      steps {
        script {
          docker.image('docker:latest').inside('-v /var/run/docker.sock:/var/run/docker.sock') {
            withCredentials([usernamePassword(credentialsId: 'dockerhub', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
              def version = "v1.0.${BUILD_NUMBER}"
              sh "docker build -t clupai8o0/notes-app-server:${version} ./server"
              sh "docker build -t clupai8o0/notes-app-client:${version} ./client"
              sh "echo '$DOCKER_PASS' | docker login -u '$DOCKER_USER' --password-stdin"
              sh "docker push clupai8o0/notes-app-server:${version}"
              sh "docker push clupai8o0/notes-app-client:${version}"
            }
          }
        }
      }
    }

    stage('Code Quality Analysis') {
      steps {
        withSonarQubeEnv('SonarCloud') {
          withCredentials([string(credentialsId: 'notes-app-sonarcloud-token', variable: 'SONAR_TOKEN')]) {
            script {
              def scannerHome = tool name: 'SonarScanner'
              dir('server') {
                sh "${scannerHome}/bin/sonar-scanner -Dsonar.login=${SONAR_TOKEN}"
              }
              dir('client') {
                sh "${scannerHome}/bin/sonar-scanner -Dsonar.login=${SONAR_TOKEN}"
              }
            }
          }
        }
      }
    }

    stage('Snyk Security Scan') {
      steps {
        withCredentials([string(credentialsId: 'snyk-token', variable: 'SNYK_TOKEN')]) {
          script {
            dir('server') {
              sh """
                npm install --force
                npx snyk auth $SNYK_TOKEN
                npx snyk test 
              """
            }
            dir('client') {
              sh """
                npm install --force
                npx snyk auth $SNYK_TOKEN
                npx snyk test 
              """
            }
          }
        }
      }
    }

    stage('Release Tagging') {
      steps {
        script {
          def version = "v1.0.${BUILD_NUMBER}"

          // Update package.json versions
          sh """
            cd server
            npm version ${version} --no-git-tag-version
            cd ../client
            npm version ${version} --no-git-tag-version
          """

          withCredentials([usernamePassword(credentialsId: 'github-push-creds', usernameVariable: 'GIT_USER', passwordVariable: 'GIT_TOKEN')]) {
            sh """
              git config user.email "clupai8o0@gmail.com"
              git config user.name "Clupai8o0"
              git remote set-url origin https://${GIT_USER}:${GIT_TOKEN}@github.com/Clupai8o0/notes-app.git
              git add server/package.json client/package.json
              git commit -m "Release version 1.0.${BUILD_NUMBER}" || echo "No changes to commit"
              git tag v1.0.${BUILD_NUMBER}
              git push origin main --tags
            """
          }
        }
      }
    }


    stage('Deploy to Production') {
      steps {
        input message: 'Deploy to Production?'
        script {
          def version = "v1.0.${BUILD_NUMBER}"
          deployToProd(version)
        }
      }
    }

    stage('Smoke Test on EC2') {
      steps {
        script {
          // Allow a few seconds for services to spin up
          sleep 10

          // Replace 223 with your app port if different
          def url = "http://${EC2_IP}/server/ping"

          // Try hitting /ping once, fail if it doesn’t return HTTP 200
          sh """
            STATUS=\$(curl -o /dev/null -s -w '%{http_code}' ${url})
            if [ \"\$STATUS\" != \"200\" ]; then
              echo \"❌ Smoke test failed! HTTP status \$STATUS from ${url}\"
              exit 1
            else
              echo \"✅ Smoke test passed! ${url} is reachable.\"
            fi
          """
        }
      }
    }
  
    stage('Monitoring and Alerts') {
      steps {
        script {
          sleep 15

          // 1. Basic health-check: if /metrics returns 200, assume Prometheus sees you too
          sh """
            if ! curl -f http://${EC2_IP}/server/metrics; then
              echo "❌ /metrics endpoint failed!"
              exit 1
            fi
            echo "✅ /metrics endpoint OK"
          """

          // 2. Check Prometheus target status via its API, but just look for "up" in the JSON
          sh """
            RES=\$(curl -s "http://${EC2_IP}:9090/api/v1/targets?state=active")
            echo "\$RES" | grep -q '"job":"notes-app"' && echo "✅ Prometheus target 'notes-app' is ACTIVE" || (echo "❌ Prometheus target not active" && exit 1)
          """
        }
      }
    }
  }

  post {
    success {
      echo '✅ CI/CD Pipeline completed successfully'
    }
    failure {
      echo '❌ Deployment failed — rolling back to last known good version'
      script {
        // Use the last successful build number as a fallback
        def lastGood = currentBuild.getPreviousSuccessfulBuild()?.getNumber()
        if (lastGood) {
          def rollbackVersion = "v1.0.${lastGood}"
          echo "↩️ Rolling back to ${rollbackVersion}"
          deployToProd(rollbackVersion)
        } else {
          error "No previous successful build to roll back to!"
        }
      }
    }
  }
}

// Helper method for deployment via SSH + Docker Compose
def deployToProd(String version) {
  sshagent (credentials: [env.DEPLOY_KEY]) {
    sh """
      ssh -o StrictHostKeyChecking=no ${EC2_HOST} << 'ENDSSH'
cd ${DEPLOY_DIR}
cp docker-compose.prod.tpl docker-compose.prod.yml
sed -i 's/v1.0.\\\${BUILD_NUMBER}/${version}/g' docker-compose.prod.yml
docker pull clupai8o0/notes-app-server:${version}
docker pull clupai8o0/notes-app-client:${version}
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
ENDSSH
    """
  }
}
