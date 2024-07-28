export function resetFolder(folder) {
    folder.__controllers.forEach(c => c.setValue(c.initialValue));
}
export function foldToggleHide(folder) {
    if (folder && !folder.__li) {
        if (folder.__ul.style.display == 'none') { folder.__ul.style = '' } else {
            folder.__ul.style = '';
        };
    }
}
export function ctrlToggleHide(controller, boolFn) {
    //controller.
    if (controller) {
        const bool = boolFn ? boolFn() : true;
        if (controller.__li.style.display == 'none') {
            controller.__li.style = ''
        } else {
            if (bool) controller.__li.style.display = 'none';
        };
    }
}

export default { resetFolder, foldToggleHide, ctrlToggleHide }