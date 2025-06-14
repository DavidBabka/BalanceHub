export function navigateTo(state) {
    document.querySelectorAll(".state").forEach((el) => el.classList.add("hidden"));
    const target = document.getElementById(state);
    if (target) target.classList.remove("hidden");
}
