/**
 * Simulator Module
 * Visualizes G-Code toolpath in 2D/3D
 */

export class Simulator {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        this.points = [];
        this.currentPoint = 0;
        this.animationId = null;
        
        this.zoom = 1.0;
        this.offsetX = 0;
        this.offsetY = 0;
        this.dragging = false;
        
        this.initializeControls();
    }

    initializeControls() {
        // Controles de zoom com wheel
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            this.zoom(delta, e.offsetX, e.offsetY);
        });

        // Pan com mouse
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                this.dragging = true;
                this.lastX = e.clientX;
                this.lastY = e.clientY;
            }
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (this.dragging) {
                const dx = e.clientX - this.lastX;
                const dy = e.clientY - this.lastY;
                this.pan(dx, dy);
                this.lastX = e.clientX;
                this.lastY = e.clientY;
            }
        });

        this.canvas.addEventListener('mouseup', () => {
            this.dragging = false;
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.dragging = false;
        });
    }

    loadGCode(gcode) {
        this.points = this.parseGCode(gcode);
        this.currentPoint = 0;
        this.draw();
    }

    parseGCode(gcode) {
        const lines = gcode.split('
');
        const points = [];
        let currentX = 0, currentY = 0, currentZ = 0;
        
        for (const line of lines) {
            // Remover comentários
            const code = line.split(';')[0].trim();
            if (!code) continue;
            
            // Extrair comandos
            const gMatch = code.match(/G0|G1|G2|G3/);
            if (!gMatch) continue;
            
            const xMatch = code.match(/X([-\d.]+)/);
            const yMatch = code.match(/Y([-\d.]+)/);
            const zMatch = code.match(/Z([-\d.]+)/);
            
            if (xMatch) currentX = parseFloat(xMatch[1]);
            if (yMatch) currentY = parseFloat(yMatch[1]);
            if (zMatch) currentZ = parseFloat(zMatch[1]);
            
            points.push({
                x: currentX,
                y: currentY,
                z: currentZ,
                rapid: gMatch[0] === 'G0' // Movimento rápido
            });
        }
        
        return points;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Desenhar fundo
        this.ctx.fillStyle = '#f8fafc';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Desenhar grid
        this.drawGrid();
        
        // Aplicar transformações
        this.ctx.save();
        this.ctx.translate(this.offsetX, this.offsetY);
        this.ctx.scale(this.zoom, this.zoom);
        
        // Desenhar toolpath
        this.drawToolpath();
        
        this.ctx.restore();
    }

    drawGrid() {
        const step = 50 * this.zoom;
        const offsetX = this.offsetX % step;
        const offsetY = this.offsetY % step;
        
        this.ctx.strokeStyle = '#e2e8f0';
        this.ctx.lineWidth = 1;
        
        // Linhas verticais
        for (let x = offsetX; x < this.canvas.width; x += step) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Linhas horizontais
        for (let y = offsetY; y < this.canvas.height; y += step) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    drawToolpath() {
        if (this.points.length === 0) return;
        
        // Desenhar caminho
        this.ctx.beginPath();
        this.ctx.strokeStyle = '#2563eb';
        this.ctx.lineWidth = 2 / this.zoom;
        
        let first = true;
        for (let i = 0; i <= this.currentPoint; i++) {
            const point = this.points[i];
            if (!point) continue;
            
            const x = point.x;
            const y = point.y;
            
            if (first) {
                this.ctx.moveTo(x, y);
                first = false;
            } else {
                if (point.rapid) {
                    // Movimentos rápidos em linha tracejada
                    this.ctx.stroke();
                    this.ctx.beginPath();
                    this.ctx.setLineDash([5, 3]);
                    this.ctx.strokeStyle = '#94a3b8';
                    this.ctx.moveTo(this.points[i-1].x, this.points[i-1].y);
                    this.ctx.lineTo(x, y);
                    this.ctx.stroke();
                    this.ctx.beginPath();
                    this.ctx.setLineDash([]);
                    this.ctx.strokeStyle = '#2563eb';
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
        }
        
        this.ctx.stroke();
        
        // Desenhar pontos
        for (let i = 0; i <= this.currentPoint; i++) {
            const point = this.points[i];
            if (!point) continue;
            
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, 3 / this.zoom, 0, Math.PI * 2);
            
            if (point.rapid) {
                this.ctx.fillStyle = '#94a3b8';
            } else {
                // Cor baseada na profundidade
                const depthNormalized = Math.abs(point.z) / 5; // Assumindo profundidade máxima de 5mm
                const hue = 240 * (1 - depthNormalized); // Azul para raso, vermelho para profundo
                this.ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
            }
            
            this.ctx.fill();
        }
    }

    animate() {
        const animateStep = () => {
            if (this.currentPoint < this.points.length - 1) {
                this.currentPoint++;
                this.draw();
                this.animationId = requestAnimationFrame(animateStep);
            }
        };
        
        this.currentPoint = 0;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.animationId = requestAnimationFrame(animateStep);
    }

    clear() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.currentPoint = 0;
        this.draw();
    }

    zoom(factor, mouseX, mouseY) {
        const oldZoom = this.zoom;
        this.zoom *= factor;
        
        // Ajustar offset para zoom centrado no mouse
        if (mouseX !== undefined && mouseY !== undefined) {
            const dx = mouseX - this.offsetX;
            const dy = mouseY - this.offsetY;
            
            this.offsetX -= dx * (factor - 1);
            this.offsetY -= dy * (factor - 1);
        }
        
        this.draw();
    }

    pan(dx, dy) {
        this.offsetX += dx;
        this.offsetY += dy;
        this.draw();
    }

    fitToView() {
        if (this.points.length === 0) return;
        
        // Encontrar bounds
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        
        for (const point of this.points) {
            minX = Math.min(minX, point.x);
            maxX = Math.max(maxX, point.x);
            minY = Math.min(minY, point.y);
            maxY = Math.max(maxY, point.y);
        }
        
        const width = maxX - minX;
        const height = maxY - minY;
        
        // Calcular zoom para caber na tela
        const zoomX = (this.canvas.width - 100) / width;
        const zoomY = (this.canvas.height - 100) / height;
        this.zoom = Math.min(zoomX, zoomY, 5);
        
        // Centralizar
        this.offsetX = (this.canvas.width - width * this.zoom) / 2 - minX * this.zoom;
        this.offsetY = (this.canvas.height - height * this.zoom) / 2 - minY * this.zoom;
        
        this.draw();
    }
}