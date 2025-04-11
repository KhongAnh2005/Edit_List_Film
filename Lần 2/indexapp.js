const apiKey = '42e8a383317db0a25624e00585d30469'; // Giữ nguyên API key

// Danh sách thể loại gốc
const genres = [
    { id: 28, name: "Hành động" },
    { id: 35, name: "Hài hước" },
    { id: 18, name: "Tâm lý" },
    { id: 27, name: "Kinh dị" },
    { id: 10749, name: "Lãng mạn" },
    // { id: 16, name: "Hoạt hình" }, // Loại bỏ vì đã có section riêng
    { id: 878, name: "Khoa học viễn tưởng" },
    { id: 12, name: "Phiêu lưu" },
    { id: 53, name: "Hồi hộp" },
    { id: 99, name: "Phim tài liệu" } // Thêm ví dụ
];

// Các danh mục tùy chỉnh và API endpoints tương ứng
const customCategories = [
    { name: "Phim Đang Chiếu", url: `https://api.themoviedb.org/3/movie/now_playing?api_key=${apiKey}&language=vi&page=1®ion=VN` },
    { name: "Phim Thịnh Hành Trong Tuần", url: `https://api.themoviedb.org/3/trending/movie/week?api_key=${apiKey}&language=vi` },
    { name: "Phim Được Đánh Giá Cao", url: `https://api.themoviedb.org/3/movie/top_rated?api_key=${apiKey}&language=vi&page=1®ion=VN` },
    { name: "Chương Trình TV Thịnh Hành", url: `https://api.themoviedb.org/3/trending/tv/week?api_key=${apiKey}&language=vi` },
    // Thêm các danh mục khác nếu muốn
    // { name: "Phim Hàn Quốc", url: `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&language=vi&with_origin_country=KR&sort_by=popularity.desc` },
];

const genreMenu = document.getElementById('genre-menu');
const categorySectionsContainer = document.getElementById('category-sections');

// --- Render Genre Dropdown ---
genres.forEach(genre => {
    const li = document.createElement('li');
    // Cập nhật href để scroll đến section tương ứng (nếu muốn) hoặc bỏ href="#"
    li.innerHTML = `<a class="dropdown-item" href="#genre-${genre.id}" data-id="${genre.id}">${genre.name}</a>`;
    genreMenu.appendChild(li);
});

// --- Hàm tạo thẻ phim (Giữ nguyên) ---
function createMediaCard(media, mediaType) {
    const { id, backdrop_path, poster_path, title, name } = media; // Ưu tiên poster_path cho card nhỏ
    const movieTitle = title || name || 'Không rõ';
    const imagePath = poster_path || backdrop_path; // Dùng poster trước, fallback về backdrop

    const card = document.createElement("div");
    // Quan trọng: KHÔNG thêm class "movie-item" ở đây vì Owl Carousel sẽ tự bọc
    card.classList.add("item"); // Class mặc định của Owl Carousel item

    const imageUrl = imagePath
        ? `https://image.tmdb.org/t/p/w300${imagePath}` // w300 hoặc w500 tùy kích thước mong muốn
        : 'https://via.placeholder.com/300x450?text=No+Image'; // Placeholder phù hợp tỉ lệ poster

    // Cấu trúc HTML cho item trong category carousel
    card.innerHTML = `
      <div class="movie-item"> <!-- Bọc nội dung trong movie-item để áp style cũ -->
        <img src="${imageUrl}" alt="${movieTitle}" loading="lazy"> <!-- Thêm loading="lazy" -->
        <div class="title">
          <a href="watch.html?id=${id}&mediaType=${mediaType}" title="${movieTitle}">${movieTitle}</a>
        </div>
      </div>
    `;
    return card;
}

// --- Hàm khởi tạo Owl Carousel cho một section ---
function initCategoryCarousel(carouselId) {
    const carouselElement = $(`#${carouselId}`);
    if (carouselElement.length > 0 && !carouselElement.hasClass('owl-loaded')) { // Kiểm tra xem đã init chưa
        carouselElement.owlCarousel({
            loop: false, // Không lặp lại từ đầu khi hết item
            margin: 15, // Khoảng cách giữa các item
            nav: false, // Tắt nav mặc định của Owl
            dots: false, // Tắt dots mặc định
            lazyLoad: true, // Hỗ trợ lazy load ảnh
            responsive: {
                0: { items: 2 },
                576: { items: 3 },
                768: { items: 4 },
                992: { items: 5 },
                1200: { items: 6 } // Hiển thị nhiều item hơn trên màn hình lớn
            }
        });

        // Gán sự kiện cho nút custom (nếu có)
        const section = carouselElement.closest('.category-section');
        section.find('.category-prev-btn').click(function () {
            carouselElement.trigger('prev.owl.carousel');
        });
        section.find('.category-next-btn').click(function () {
            carouselElement.trigger('next.owl.carousel');
        });
    } else if (carouselElement.length === 0) {
        console.warn(`Carousel element #${carouselId} not found.`);
    }
}


// --- Hàm tạo HTML cho một Section Category ---
function createCategorySection(title, carouselId, anchorId = '') {
    const section = document.createElement('section');
    section.classList.add('category-section', 'my-5');
    if (anchorId) {
        section.id = anchorId; // Thêm id để anchor link từ dropdown
    }

    section.innerHTML = `
        <div class="container">
            <div class="section-header d-flex justify-content-between align-items-center mb-4">
                <h2 class="section-title">${title}</h2>
                <div class="custom-nav-buttons">
                    <button class="category-prev-btn"><span class="carousel-nav-icon">❮</span></button>
                    <button class="category-next-btn"><span class="carousel-nav-icon">❯</span></button>
                </div>
            </div>
            <div class="owl-carousel owl-theme category-carousel" id="${carouselId}">
                <!-- Movie items will be loaded here -->
            </div>
        </div>
    `;
    categorySectionsContainer.appendChild(section);
}

// --- Hàm fetch dữ liệu và hiển thị cho một category ---
async function fetchAndDisplayCategory(title, apiUrl, carouselId, mediaType = 'movie', anchorId = '') {
    // 1. Tạo cấu trúc HTML cho section trước
    createCategorySection(title, carouselId, anchorId);
    const container = document.getElementById(carouselId);
    if (!container) {
        console.error(`Container #${carouselId} not found for ${title}`);
        return;
    }

    // 2. Fetch dữ liệu
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // 3. Xóa nội dung cũ (nếu có) và thêm card mới
        container.innerHTML = ''; // Clear existing items (nếu có)
        const results = data.results || [];

        if (results.length === 0) {
            container.innerHTML = '<p class="text-muted ms-3">Không có phim trong danh mục này.</p>'; // Thông báo nếu không có kết quả
            return; // Không cần init carousel nếu không có item
        }

        results.slice(0, 20).forEach(item => { // Giới hạn số lượng item cho mỗi carousel
            // Xác định mediaType chính xác hơn nếu API trả về cả movie và tv
            let itemMediaType = mediaType;
            if (item.media_type) { // Thường có trong API trending
                 itemMediaType = item.media_type;
            } else if (apiUrl.includes('/tv')) { // Nếu url là của TV
                 itemMediaType = 'tv';
            }
            // Bỏ qua person nếu có trong trending
            if (itemMediaType === 'person') return;

            const card = createMediaCard(item, itemMediaType);
            container.appendChild(card);
        });

        // 4. Khởi tạo Owl Carousel cho section này
        initCategoryCarousel(carouselId);

    } catch (error) {
        console.error(`Error fetching category "${title}":`, error);
        container.innerHTML = `<p class="text-danger ms-3">Lỗi tải danh mục: ${title}</p>`;
    }
}

// --- Hàm fetch phim đang chiếu cho Hero (Giữ nguyên và cải thiện) ---
async function fetchHeroMovies() {
    const url = `https://api.themoviedb.org/3/movie/now_playing?api_key=${apiKey}&language=vi&page=1®ion=VN`; // Thêm region=VN
    try {
        const response = await fetch(url);
        const data = await response.json();
        const container = $('#hero-carousel');
        container.empty(); // Xóa item cũ trước khi thêm mới

        // Lọc bỏ phim không có backdrop
        const moviesWithBackdrop = data.results.filter(movie => movie.backdrop_path);

        moviesWithBackdrop.slice(0, 6).forEach(movie => {
            const bgImage = `https://image.tmdb.org/t/p/original${movie.backdrop_path}`;
            const overview = movie.overview || "Chưa có mô tả."; // Fallback

            const item = `
              <div class="item" style="background-image: url('${bgImage}');">
                <div class="overlay">
                  <h3>${movie.title}</h3>
                  <p>${overview.substring(0, 150)}${overview.length > 150 ? '...' : ''}</p>
                  <a href="watch.html?id=${movie.id}&mediaType=movie" class="btn btn-warning mt-2">Xem chi tiết</a>
                </div>
              </div>
            `;
            container.append(item);
        });

        // Khởi tạo hoặc cập nhật Owl Carousel Hero
        if (container.hasClass('owl-loaded')) {
            container.trigger('destroy.owl.carousel'); // Hủy carousel cũ nếu đã tồn tại
        }
        container.owlCarousel({
            items: 1,
            loop: true,
            nav: true,
            dots: false, // Thường thì hero slider không cần dots
            autoplay: true,
            autoplayTimeout: 5000,
            autoplayHoverPause: true,
            lazyLoad: true,
            navText: [
                "<span class='owl-prev-icon'>❮</span>",
                "<span class='owl-next-icon'>❯</span>"
            ]
        });
    } catch (error) {
        console.error("Error fetching hero movies:", error);
        $('#hero-carousel').html('<p class="text-danger text-center">Không thể tải được phim nổi bật.</p>');
    }
}


// --- Hàm fetch phim hoạt hình mới nhất (Giữ nguyên và cải thiện) ---
async function fetchLatestCartoon() {
    const url = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&language=vi&with_genres=16&sort_by=popularity.desc`; // Thêm sort_by
    try {
        const response = await fetch(url);
        const data = await response.json();
        const container = $('#cartoon-carousel');
        container.empty(); // Xóa item cũ

        if (data.results && data.results.length > 0) {
            data.results.slice(0, 15).forEach(movie => { // Giới hạn số lượng
                const item = createMediaCard(movie, 'movie'); // Dùng lại createMediaCard
                container.append(item);
            });
            initCartoonCarousel(); // Gọi hàm khởi tạo carousel riêng
        } else {
            container.html('<p class="text-muted">Không có phim hoạt hình mới.</p>');
        }
    } catch (error) {
        console.error('Error fetching cartoon movies:', error);
        $('#cartoon-carousel').html('<p class="text-danger">Lỗi tải phim hoạt hình.</p>');
    }
}

// --- Hàm khởi tạo Cartoon Carousel (Giữ nguyên và sửa nút) ---
function initCartoonCarousel() {
    const carouselElement = $('#cartoon-carousel');
    if (carouselElement.length > 0 && !carouselElement.hasClass('owl-loaded')) {
        carouselElement.owlCarousel({
            // Giữ nguyên các options cũ
            loop: false,
            margin: 15,
            nav: false, // Tắt nav mặc định
            dots: false,
            lazyLoad: true,
            responsive: {
                0: { items: 2 }, // Điều chỉnh cho hợp lý hơn
                576: { items: 3 },
                768: { items: 4 },
                992: { items: 5 },
                1200: { items: 6 }
            }
        });

        // Gán sự kiện cho nút custom của cartoon carousel
        $('.nav-prev-btn.cartoon-prev').click(function () {
            carouselElement.trigger('prev.owl.carousel');
        });
        $('.nav-next-btn.cartoon-next').click(function () {
            carouselElement.trigger('next.owl.carousel');
        });
    }
}

// --- Hàm khởi tạo ứng dụng ---
function initializeApp() {
    fetchHeroMovies();
    fetchLatestCartoon(); // Fetch cartoon section

    // Fetch các category từ danh sách genres
    genres.forEach(genre => {
        const apiUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&language=vi&with_genres=${genre.id}&sort_by=popularity.desc`;
        const carouselId = `genre-${genre.id}-carousel`;
        const anchorId = `genre-${genre.id}`; // ID để anchor link
        fetchAndDisplayCategory(genre.name, apiUrl, carouselId, 'movie', anchorId);
    });

    // Fetch các category tùy chỉnh
    customCategories.forEach((category, index) => {
        const carouselId = `custom-category-${index}-carousel`;
        // Xác định media type dựa trên URL (đơn giản)
        const mediaType = category.url.includes('/tv') ? 'tv' : 'movie';
        fetchAndDisplayCategory(category.name, category.url, carouselId, mediaType);
    });

    // --- Xử lý sự kiện khác (Ví dụ: Search, Navbar links) ---

    // Search Form (Chưa có chức năng tìm kiếm thực sự)
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    if(searchForm && searchInput) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Ngăn form submit mặc định
            const searchTerm = searchInput.value.trim();
            if (searchTerm) {
                // Chuyển hướng đến trang kết quả tìm kiếm (cần tạo trang search.html)
                // window.location.href = `search.html?query=${encodeURIComponent(searchTerm)}`;
                alert(`Chức năng tìm kiếm "${searchTerm}" chưa được triển khai.`);
            }
        });
    }

    // Xử lý click vào link TV Series / Anime (Ví dụ: scroll tới section tương ứng)
    // Lưu ý: Cần đảm bảo section TV/Anime được tạo ra từ customCategories hoặc genres
    const tvLink = document.getElementById('tv-series-link');
    if(tvLink){
        tvLink.addEventListener('click', (e) => {
            e.preventDefault();
            // Tìm section TV (ví dụ dựa vào title hoặc id đã tạo)
            // const tvSection = document.getElementById('custom-category-3'); // ID ví dụ
            // if(tvSection) tvSection.scrollIntoView({ behavior: 'smooth' });
             alert("Chức năng xem TV Series riêng chưa triển khai. Xem trong 'Chương Trình TV Thịnh Hành'.");
        });
    }
     const animeLink = document.getElementById('anime-link');
     if(animeLink){
        animeLink.addEventListener('click', (e) => {
            e.preventDefault();
            // Tìm section Anime (thường là genre 16)
            const animeSection = document.getElementById('genre-16');
            if(animeSection) {
                animeSection.scrollIntoView({ behavior: 'smooth' });
            } else {
                alert("Không tìm thấy mục Anime. Hãy thử xem trong 'Latest Cartoon'.");
            }
        });
     }

    // Xử lý click vào dropdown genre item (scroll đến section)
    genreMenu.addEventListener('click', function (e) {
        if (e.target.classList.contains('dropdown-item')) {
            e.preventDefault();
            const targetId = e.target.getAttribute('href'); // Lấy href="#genre-id"
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                 // Đóng dropdown sau khi click (trên mobile)
                var dropdownToggle = genreMenu.previousElementSibling;
                var bsDropdown = bootstrap.Dropdown.getInstance(dropdownToggle);
                if (bsDropdown) {
                   // bsDropdown.hide(); // Có thể gây lỗi nếu chưa init đúng cách, cân nhắc
                }

            }
        }
    });

    // Xóa các hàm và listener không cần thiết cũ
    // fetchMoviesByGenre, fetchTVSeries, fetchAnime và listener của chúng
    // document.querySelectorAll('.nav-link').forEach(link => { ... }); cũ
}

// --- Chạy khi DOM sẵn sàng ---
$(document).ready(initializeApp);