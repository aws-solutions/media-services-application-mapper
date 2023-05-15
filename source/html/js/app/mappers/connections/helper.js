export function checkAdditionalConnections(results, connection) {
    const shouldEndWith = connection.arn.endsWith("0") ? "1" : "0";
    return _.filter(results, function (o) {
        if (
            o.from === connection.from &&
            o.to === connection.to
        ) {
            if (o.arn.endsWith(shouldEndWith)) return true;
        }
        return false;
    });
}
