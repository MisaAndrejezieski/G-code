/**
 * G-Code Generator Module
 * Generates optimized G-Code from cutting points
 */

export class GCodeGenerator {
    constructor() {
        this.gcode = [];
    }

    generate(points, config) {
        this.gcode = [];
        
        this.addHeader(config);
        this.generateToolpath(points, config);
        this.addFooter(config);
        
        return this.gcode.join('
');
    }

    addHeader(config) {
        const date = new Date().toLocaleString();
        
        this.addComment('========================================');
        this.addComment(`G-Code gerado em: ${date}`);
        this.addComment('Image2GCode Professional v1.0');
        this.addComment('========================================');
        this.addComment('');
        
        // Configurações iniciais
        this.addCommand('G90', 'Posicionamento absoluto');
        this.addCommand('G21', 'Unidades em mm');
        this.addCommand('G17', 'Plano XY');
        this.addCommand('G40', 'Cancelar compensação de raio');
        this.addCommand('G49', 'Cancelar compensação de altura');
        this.addCommand('G80', 'Cancelar ciclos fixos');
        this.addCommand('');
        
        // Mover para posição inicial segura
        this.addCommand(`G0 Z${config.safeHeight}`, 'Subir para altura de segurança');
        this.addCommand('G0 X0 Y0', 'Posicionar na origem');
        this.addCommand('');
        
        this.addComment('Iniciando corte...');
        this.addCommand(`F${config.feedRate}`, 'Configurar velocidade de avanço');
    }

    generateToolpath(points, config) {
        if (points.length === 0) {
            this.addComment('Nenhum ponto de corte encontrado!');
            return;
        }

        let lastZ = config.safeHeight;
        let lastX = 0;
        let lastY = 0;

        for (let i = 0; i < points.length; i++) {
            const point = points[i];
            
            // Mover para posição X,Y se necessário
            if (lastX !== point.x || lastY !== point.y) {
                if (lastZ > config.safeHeight - 0.1) {
                    this.addCommand(`G0 X${this.format(point.x)} Y${this.format(point.y)}`, 
                        'Posicionamento rápido');
                } else {
                    // Se já estiver cortando, subir para recuo
                    this.addCommand(`G0 Z${config.retractHeight}`, 'Recuar para próximo movimento');
                    this.addCommand(`G0 X${this.format(point.x)} Y${this.format(point.y)}`, 
                        'Mover para próxima posição');
                }
                
                lastX = point.x;
                lastY = point.y;
            }
            
            // Se for ponto de corte, descer e cortar
            if (point.cut) {
                if (lastZ > config.cutDepth + 0.1) {
                    // Descer para profundidade de corte
                    this.addCommand(`G1 Z${this.format(config.cutDepth)} F${config.plungeRate}`, 
                        'Penetrar no material');
                    lastZ = config.cutDepth;
                }
                
                // Pequeno movimento para garantir corte
                if (i < points.length - 1 && points[i + 1].cut) {
                    const next = points[i + 1];
                    this.addCommand(`G1 X${this.format(next.x)} Y${this.format(next.y)}`, 
                        'Corte contínuo');
                    lastX = next.x;
                    lastY = next.y;
                }
            }
        }
    }

    addFooter(config) {
        this.addCommand('');
        this.addComment('Finalizando programa...');
        this.addCommand(`G0 Z${config.safeHeight}`, 'Subir para altura segura');
        this.addCommand('G0 X0 Y0', 'Retornar à origem');
        this.addCommand('M30', 'Fim do programa');
    }

    format(value) {
        // Formatar número com 3 casas decimais
        return value.toFixed(3).replace(/\.?0+$/, '');
    }

    addCommand(command, comment = '') {
        if (comment) {
            this.gcode.push(`${command} ; ${comment}`);
        } else {
            this.gcode.push(command);
        }
    }

    addComment(comment) {
        this.gcode.push(`; ${comment}`);
    }
}