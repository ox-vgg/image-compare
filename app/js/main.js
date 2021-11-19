class MainView {
    constructor(container, snackbar) {
        this.c = container;
        this.snackbar = snackbar;
        this.select_images_btn = document.getElementById('image_select_btn');
        this.samples_btn = document.getElementById('try_samples_btn');
        this.samples_btn.onclick = () => {
            this.c.dispatchEvent(new CustomEvent('samples'));
        }

        this.file_input = document.getElementById('image_select_input');

        this.select_images_btn.onclick = this.select_images.bind(this);
        this.file_input.onchange = this.handle_files.bind(this);
    }

    async select_images() {
        if(this.file_input) {
            this.file_input.click();
        }

    }

    async handle_files(e) {
        if (e.target.files.length < 2) {
            // TODO: Raise an event to show toast / snackbar
            this.snackbar.MDCSnackbar.open();
            return;
        }

        // TODO: Raise warning if more than 2 images are selected.
        const { files } = e.target;
        const urls = [];
        for (let i = 0; i < 2; i++) {
            urls.push(URL.createObjectURL(files[i]));
        }

        const ev = new CustomEvent('select_image', {
            detail: {
                urls
            }
        });
        this.c.dispatchEvent(ev);

        e.target.value = null;
    }
}