// excelStyles.js
function createExcelStyles(wb) {
    const border = {
        left: { style: 'thin', color: 'black' },
        right: { style: 'thin', color: 'black' },
        top: { style: 'thin', color: 'black' },
        bottom: { style: 'thin', color: 'black' },
    };

    const headerStyle = wb.createStyle({
        font: {
            bold: true,
            color: '#FFFFFF',
            size: 12,
        },
        alignment: {
            horizontal: 'center',
            vertical: 'center',
            wrapText: true,
        },
        fill: {
            type: 'pattern',
            patternType: 'solid',
            fgColor: '#4F81BD',
        },
        border,
    });

    const cellStyle = wb.createStyle({
        alignment: {
            vertical: 'center',
            wrapText: true,
            horizontal: 'center',
        },
        border,
    });

    const footerStyle = wb.createStyle({
        font: {
            italic: true,
            color: '#999999',
            size: 10,
        },
        alignment: {
            horizontal: 'center',
        },
    });

    return { headerStyle, cellStyle, footerStyle };
}

module.exports = createExcelStyles;
