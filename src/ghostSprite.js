import * as THREE from 'three';

export class GhostSprite {
  constructor(scene) {
    this.scene = scene;
    
    // Create canvas texture for a cute 2D ghost
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    this.drawGhostTexture(ctx, false); // Initial idle draw
    
    this.texture = new THREE.CanvasTexture(canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;

    const geometry = new THREE.PlaneGeometry(0.9, 0.9);
    const material = new THREE.MeshBasicMaterial({
      map: this.texture,
      transparent: true,
      depthWrite: false
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(-9.2, 0, 0.5); // Start position
    this.scene.add(this.mesh);

    this.floatTimer = 0;
    this.isMoving = false;
    this.canvas = canvas;
    this.ctx = ctx;
  }

  drawGhostTexture(ctx, isMoving) {
    ctx.clearRect(0, 0, 128, 128);

    // Cute Ghost Body
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(64, 50, 36, Math.PI, 0, false); // Head
    ctx.lineTo(100, 95);
    
    // Wavy ghost bottom
    if (isMoving) {
      ctx.quadraticCurveTo(88, 85, 76, 95);
      ctx.quadraticCurveTo(64, 85, 52, 95);
      ctx.quadraticCurveTo(40, 85, 28, 95);
    } else {
      ctx.quadraticCurveTo(88, 105, 76, 95);
      ctx.quadraticCurveTo(64, 105, 52, 95);
      ctx.quadraticCurveTo(40, 105, 28, 95);
    }
    
    ctx.lineTo(28, 50);
    ctx.closePath();
    ctx.fill();

    // Cute Eyes
    ctx.fillStyle = '#222222';
    ctx.beginPath();
    ctx.ellipse(50, 48, 5, 8, 0, 0, Math.PI * 2);
    ctx.ellipse(78, 48, 5, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eye Highlights
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(48, 45, 2, 0, Math.PI * 2);
    ctx.arc(76, 45, 2, 0, Math.PI * 2);
    ctx.fill();

    // Cute Blush Spots
    ctx.fillStyle = 'rgba(255, 150, 200, 0.6)';
    ctx.beginPath();
    ctx.arc(42, 58, 6, 0, Math.PI * 2);
    ctx.arc(86, 58, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  update(delta, moving) {
    this.floatTimer += delta * 4;
    
    // Idle bobbing animation
    if (!moving) {
      this.mesh.position.z = 0.5 + Math.sin(this.floatTimer) * 0.05;
    }

    if (this.isMoving !== moving) {
      this.isMoving = moving;
      this.drawGhostTexture(this.ctx, this.isMoving);
      this.texture.needsUpdate = true;
    }
  }
}