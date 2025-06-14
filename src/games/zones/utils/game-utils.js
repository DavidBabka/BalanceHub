function distance(player, target) {
    return Math.hypot(target.posX - player.posX, target.posY - player.posY);
}

export function collision(player, target) {
    return distance(player, target) < (target.innerRadius - player.radius);
}

export function targetComplete(target) {
    return target.outerRadius <= target.innerRadius;
}
