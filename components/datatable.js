class DataTable {
    constructor(id) {
        this.id = id;
    }

    update(data, columns) {
        let table = d3.select(this.id);

        let usingData = Object.keys(data).length > 200 ?
            data.slice(0, 30) :
            data;

        let rows = table
            .selectAll("tr")
            .data(usingData)
            .join("tr");

        rows.selectAll("td")
            .data(d => columns.map(c => d[c]))
            .join("td")
            .text(d => d);
    }
}
