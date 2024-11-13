import { GameObject } from "./gameObject.js";
import { fastDistanceCalc, squaredDistance, normalizeVector } from "./utility.js";

export class Enemy extends GameObject {
    constructor(game, spritesheetAsset, maxVelocity = 4, x = 800, y = 500) {
        super(game, maxVelocity, x, y);
        this.neighbors = [];

        this.vision = 100 + Math.floor(Math.random() * 150); //en pixels
        this.life = 50;

        this.loadAnimationsFromSpritesheet(spritesheetAsset, () => {
            this.animation.animationSpeed = 0.3;
            this.animation.anchor.set(0.4, 0.6);
        });
        this.setCurrentAnimation("idle");

        this.states = { IDLE: 0, CHASING: 1, ATTACKING: 2 };
        this.state = this.states.IDLE;
    }

    //mirarAlrededor
    async lookAround() {
        this.neighbors = await this.obtainNeighbors();
        this.neighborCells = await this.currentCell.getNeighborsCells();
        this.seeingPlayer = await this.evaluateSeeingPlayer();
        this.neighborToPlayer = false;
        this.touchingPlayer = false;
    
        if (this.seeingPlayer) {
            this.neighborToPlayer = this.neighbors.includes(this.game.character);
        }
    
        if (this.neighborToPlayer) {
            //SOLO SI LO TENGO DE VECINO, CALCULO LA DISTANCIA, Y ES LA DISTANCIA RAPIDA
            this.distanceToPlayer = fastDistanceCalc(
                this.container.x,
                this.container.y,
                this.game.character.container.x,
                this.game.character.container.y
            );
            //Y SI LA DISTANCIA ES MENOR A UNA CELDA, Q EN ESTE CASO LAS CELDAS NOS QUEDAN A UNA DISTANCIA Q QUEDA BIEN
            if (this.distanceToPlayer < this.game.grid.cellSize) {
                //ASUMIMOS Q ESTA TOCANDO AL PLAYER
                this.touchingPlayer = true;
            }
        } else {
            this.distanceToPlayer = null;
        }
    }
    
    //hacerCosasSegunEstado
    async doActionsByState() {
        let vecPlaterAttraction,
        vecSeparation,
        vecAlignment,
        vecCohesion,
        borders;
        
        let vectorsSum = new PIXI.Point(0, 0);
        
        //CALCULO LA FUERZA Q TRAE AL PERSONAJE PADENTRO DE LA PANTALLA DE NUEVO
        borders = await this.adjustForBorders();
        
        if (this.state == this.states.CHASING) {
            //SI ESTOY VIENDO AL PLAYER, HACERLE ATRACCION
            vecPlaterAttraction = await this.playerAttraction();
            this.setCurrentAnimation("running");
        } else if (this.state == this.states.IDLE) {
            //CALCULO LOS VECTORES PARA LOS PASOS DE BOIDS, SI NO HAY TARGET
            vecAlignment = await this.alignment(this.neighbors);
            vecCohesion = await this.cohesion(this.neighbors);
            
            this.setCurrentAnimation("running");
        }
        
        //PARA AMBOS ESTADOS: YENDO Y IDLE
        if (this.state == this.states.IDLE || this.state == this.states.CHASING) {
            vecSeparation = await this.separation(this.neighbors);
            
            //SUMO LOS VECTORES ANTES DE APLICARLOS
            vectorsSum.x += (vecSeparation || {}).x || 0;
            vectorsSum.x += (vecAlignment || {}).x || 0;
            vectorsSum.x += (vecCohesion || {}).x || 0;
            vectorsSum.x += (vecPlaterAttraction || {}).x || 0;
            vectorsSum.x += (borders || {}).x || 0;
            
            vectorsSum.y += (vecSeparation || {}).y || 0;
            vectorsSum.y += (vecAlignment || {}).y || 0;
            vectorsSum.y += (vecCohesion || {}).y || 0;
            vectorsSum.y += (vecPlaterAttraction || {}).y || 0;
            vectorsSum.y += (borders || {}).y || 0;
                       
            this.applyForce(vectorsSum);
        }
    
        // ATANCANDO
        if (this.state == this.states.ATTACKING) {
          this.velocity.x = 0;
          this.velocity.y = 0;
          this.attack();
        }
    }
    
    async update() {
        //if (this.juego.contadorDeFrames % this.equipoParaUpdate == 0) {
        this.lookAround();
        this.changeStateOnData();
        this.doActionsByState();
        //}
    
        //USA EL METODO UPDATE Q ESTA EN LA CLASE DE LA CUAL HEREDA ESTA:
        super.update();
    }

    //segunDatosCambiarDeEstado
    async changeStateOnData() {
        if (this.touchingPlayer) {
            this.state = this.states.ATTACKING;
        } else if (this.seeingPlayer) {
            this.state = this.states.CHASING;
        } else {
            this.state = this.states.IDLE;
        }
    }
    
    //atacar
    async attack() {
        //SI YA ESTABA ATANCANDO, NO CAMBIAR EL SPRITE
        if (this.currentAnimation == this.animatedSprites["attack"]) return;
    
        this.setCurrentAnimation("attack");
    }
    
    //evaluarSiEstoyViendoAlPlayer
    async evaluateSeeingPlayer() {
        const sqrDistance = squaredDistance(
          this.container.x,
          this.container.y,
          this.game.character.container.x,
          this.game.character.container.y
        );
    
        if (sqrDistance < this.vision ** 2) {
          return true;
        }
        return false;
    }
    
    //atraccionAlJugador
    async playerAttraction() {
        const vecDistance = new PIXI.Point(
          this.game.character.container.x - this.container.x,
          this.game.character.container.y - this.container.y
        );
    
        let vecNormalized = normalizeVector(vecDistance.x, vecDistance.y);
    
        //HACER NEGATIVO ESTE VECTOR Y LOS ZOMBIES TE HUYEN
        vecDistance.x = vecNormalized.x;
        vecDistance.y = vecNormalized.y;
        return vecDistance;
    }
    
    async cohesion(neighbors) {
        const vecAverage = new PIXI.Point(0, 0);
        let total = 0;
    
        neighbors.forEach((enemy) => {
            vecAverage.x += enemy.container.x;
            vecAverage.y += enemy.container.y;
            total++;
        });
    
        if (total > 0) {
            vecAverage.x /= total;
            vecAverage.y /= total;
    
            // Crear un vector que apunte hacia el centro de masa
            vecAverage.x = vecAverage.x - this.container.x;
            vecAverage.y = vecAverage.y - this.container.y;
    
            // // Escalar para que sea proporcional a la velocidad máxima
            vecAverage.x *= 0.02;
            vecAverage.y *= 0.02;
        }
    
        return vecAverage;
    }
    
    //separacion
    async separation(neighbors) {
        const vecForce = new PIXI.Point(0, 0);
    
        neighbors.forEach((enemy) => {
            const distance = squaredDistance(
              this.container.x,
              this.container.y,
              enemy.container.x,
              enemy.container.y
            );
          
            const dif = new PIXI.Point(
              this.container.x - enemy.container.x,
              this.container.y - enemy.container.y
            );
            dif.x /= distance;
            dif.y /= distance;
            vecForce.x += dif.x;
            vecForce.y += dif.y;
        });
    
        vecForce.x *= 2;
        vecForce.y *= 2;
        return vecForce;
    }
    
    //alineacion
    async alignment(neighbors) {
        const vecAverage = new PIXI.Point(0, 0);
        let total = 0;
    
        neighbors.forEach((enemy) => {
            vecAverage.x += enemy.velocity.x;
            vecAverage.y += enemy.velocity.y;
            total++;
        });
    
        if (total > 0) {
            vecAverage.x /= total;
            vecAverage.y /= total;
    
            // Escalar para que sea proporcional a la velocidad máxima
            vecAverage.x *= 0.2;
            vecAverage.y *= 0.2;
        }
    
        return vecAverage;
    }
      
    //ajustarPorBordes
    async adjustForBorders() {
        let force = new PIXI.Point(0, 0);
    
        if (this.container.x < 0) force.x = -this.container.x;
        if (this.container.y < 0) force.y = -this.container.y;
        if (this.container.x > this.game.canvaswidth)
            force.x = -(this.container.x - this.game.canvaswidth);
        if (this.container.y > this.game.canvasHeight)
            force.y = -(this.container.y - this.game.canvasHeight);
    
        return force;
    }
}